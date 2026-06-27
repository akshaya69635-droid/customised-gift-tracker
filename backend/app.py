import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models, schemas, workflow, ai_agent
from auth import get_current_user, verify_password, get_password_hash, create_access_token

# Create SQLite tables on startup
Base.metadata.create_all(bind=engine)

# Auto-seed prototype data if the database is fresh and empty
from database import SessionLocal
from seed import seed_database
db_startup = SessionLocal()
try:
    if db_startup.query(models.User).count() == 0:
        print("Fresh database detected. Auto-seeding default products, users, and orders...")
        seed_database(drop_all=False)
except Exception as startup_err:
    print(f"Database startup seeding check skipped or failed: {startup_err}")
finally:
    db_startup.close()

app = FastAPI(
    title="Paper Plane Customization Workflow Tracker API",
    description="Backend service for tracking personalized gifting order workflows",
    version="1.0.0"
)

# Configure CORS so the React frontend can make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def enrich_order(order: models.Order) -> models.Order:
    """
    Enriches the database model with calculated workflow logic fields before serialization.
    """
    is_alert, reason = workflow.check_priority_alert(order.status, order.updated_at)
    order.next_action_brief = workflow.get_next_action_brief(order.status)
    order.is_priority_alert = is_alert
    order.alert_reason = reason if is_alert else None
    return order


@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new studio user/staff account.
    """
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    db_user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "client",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and issues a JWT token.
    """
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Retrieves the current user's details.
    """
    return current_user


@app.post("/api/orders", response_model=schemas.OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Creates a new customized gift or corporate order and appends the initial workflow stage logs.
    """
    try:
        cust_name = order_in.customer_name
        cust_email = order_in.customer_email
        client_id = None
        
        if current_user.role == "client":
            cust_name = current_user.full_name or current_user.email
            cust_email = current_user.email
            client_id = current_user.id
        else:
            # Check if matching user exists to automatically link
            linked_client = db.query(models.User).filter(models.User.email == order_in.customer_email).first()
            if linked_client:
                client_id = linked_client.id
                cust_name = linked_client.full_name or order_in.customer_name
                cust_email = linked_client.email

        # 1. Create order record
        db_order = models.Order(
            customer_name=cust_name,
            customer_email=cust_email,
            client_id=client_id,
            recipient_name=order_in.recipient_name,
            recipient_address=order_in.recipient_address,
            product_name=order_in.product_name,
            order_type=order_in.order_type,
            custom_name=order_in.custom_name,
            text_message=order_in.text_message,
            photo_url=order_in.photo_url,
            status=workflow.STAGE_DESIGN_RECEIVED,
            packaging_material=order_in.packaging_material,
            greeting_card=order_in.greeting_card,
            special_instructions=order_in.special_instructions,
            ai_recommendation=ai_agent.generate_order_ai_recommendation(
                workflow.STAGE_DESIGN_RECEIVED,
                order_in.product_name,
                order_in.custom_name,
                order_in.text_message
            ),
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        # 2. Append initial history log
        initial_history = models.OrderHistory(
            order_id=db_order.id,
            status=workflow.STAGE_DESIGN_RECEIVED,
            notes="Order registered. Waiting for designer to process personalization request.",
            owner="System",
            updated_at=datetime.datetime.utcnow()
        )
        db.add(initial_history)
        db.commit()
        db.refresh(db_order)

        return enrich_order(db_order)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    order_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="ISO Date format: YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="ISO Date format: YYYY-MM-DD"),
    search: Optional[str] = Query(None, description="Search customer name, recipient name, or product name"),
    is_priority: Optional[bool] = Query(None, description="Filter only stuck orders"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lists all orders, with filtering parameters and text search.
    """
    try:
        query = db.query(models.Order)
        if current_user.role == "client":
            query = query.filter((models.Order.client_id == current_user.id) | (models.Order.customer_email == current_user.email))

        # Filter by status
        if status_filter:
            query = query.filter(models.Order.status == status_filter)

        # Filter by order type
        if order_type:
            query = query.filter(models.Order.order_type == order_type)

        # Filter by date ranges
        if start_date:
            try:
                start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(models.Order.created_at >= start_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")
        
        if end_date:
            try:
                # Include the entire day by adding 1 day minus 1 second
                end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1, seconds=-1)
                query = query.filter(models.Order.created_at <= end_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD.")

        # Search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                models.Order.customer_name.like(search_pattern) |
                models.Order.recipient_name.like(search_pattern) |
                models.Order.product_name.like(search_pattern)
            )

        orders = query.all()
        
        # Enrich orders with dynamic status/action/priority properties
        enriched_orders = [enrich_order(o) for o in orders]

        # Filter by priority if requested
        if is_priority is not None:
            enriched_orders = [o for o in enriched_orders if o.is_priority_alert == is_priority]

        return enriched_orders

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching orders: {str(e)}"
        )


@app.get("/api/orders/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Returns aggregate stats for order stages and total priority alerts.
    """
    try:
        if current_user.role == "client":
            all_orders = db.query(models.Order).filter((models.Order.client_id == current_user.id) | (models.Order.customer_email == current_user.email)).all()
        else:
            all_orders = db.query(models.Order).all()
        enriched = [enrich_order(o) for o in all_orders]

        stats = {
            "total_orders": len(enriched),
            "design_received": sum(1 for o in enriched if o.status == workflow.STAGE_DESIGN_RECEIVED),
            "design_approval": sum(1 for o in enriched if o.status == workflow.STAGE_DESIGN_APPROVAL),
            "printing": sum(1 for o in enriched if o.status == workflow.STAGE_PRINTING),
            "packing": sum(1 for o in enriched if o.status == workflow.STAGE_PACKING),
            "delivery": sum(1 for o in enriched if o.status == workflow.STAGE_DELIVERY),
            "priority_alerts": sum(1 for o in enriched if o.is_priority_alert)
        }
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard metrics: {str(e)}"
        )


@app.get("/api/orders/{order_id}", response_model=schemas.OrderDetailResponse)
def get_order_detail(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Fetches the details, history, and automated status actions for a single order.
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    if current_user.role == "client":
        if db_order.client_id != current_user.id and db_order.customer_email != current_user.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this order"
            )
            
    return enrich_order(db_order)


@app.post("/api/orders/{order_id}/status", response_model=schemas.OrderDetailResponse)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Updates the workflow stage of an order and appends a transition record to its history log.
    """
    # Validate transition target
    if status_update.status not in workflow.WORKFLOW_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow stage. Allowed: {', '.join(workflow.WORKFLOW_STAGES)}"
        )

    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )

    if current_user.role == "client":
        if db_order.client_id != current_user.id and db_order.customer_email != current_user.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this order"
            )
        if db_order.status != workflow.STAGE_DESIGN_APPROVAL or status_update.status != workflow.STAGE_PRINTING:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Clients can only transition orders from 'Design Approval' to 'Printing' (mockup approval)"
            )

    try:
        now = datetime.datetime.utcnow()
        # 1. Update Order main fields
        db_order.status = status_update.status
        db_order.updated_at = now
        db_order.ai_recommendation = ai_agent.generate_order_ai_recommendation(
            status_update.status,
            db_order.product_name,
            db_order.custom_name,
            db_order.text_message
        )
        
        # Use logged-in user name if owner is empty/missing
        owner_name = status_update.owner.strip() if status_update.owner else ""
        if not owner_name:
            owner_name = current_user.full_name or current_user.email

        # 2. Append history log
        new_history = models.OrderHistory(
            order_id=db_order.id,
            status=status_update.status,
            notes=status_update.notes or f"Workflow progressed to {status_update.status}.",
            owner=owner_name or "System",
            updated_at=now
        )
        db.add(new_history)
        
        db.commit()
        db.refresh(db_order)
        
        return enrich_order(db_order)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workflow stage: {str(e)}"
        )


# --- Products Endpoints ---
@app.get("/api/products", response_model=List[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lists all customizable base products.
    """
    return db.query(models.Product).all()


# --- Occasion Calendar Endpoints ---
@app.get("/api/occasions", response_model=List[schemas.OccasionResponse])
def list_occasions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lists client's occasions, or all occasions for staff.
    """
    if current_user.role == "client":
        return db.query(models.Occasion).filter(models.Occasion.client_id == current_user.id).all()
    return db.query(models.Occasion).all()

@app.post("/api/occasions", response_model=schemas.OccasionResponse, status_code=status.HTTP_201_CREATED)
def create_occasion(
    occasion_in: schemas.OccasionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a new occasion reminder for the logged-in client.
    """
    db_occasion = models.Occasion(
        client_id=current_user.id,
        occasion_name=occasion_in.occasion_name,
        recipient_name=occasion_in.recipient_name,
        date=occasion_in.date,
        status="Pending",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_occasion)
    db.commit()
    db.refresh(db_occasion)
    return db_occasion


# --- Corporate Enquiry Portal Endpoints ---
@app.post("/api/corporate-enquiries", response_model=schemas.CorporateEnquiryResponse, status_code=status.HTTP_201_CREATED)
def create_corporate_enquiry(
    enquiry_in: schemas.CorporateEnquiryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Submits a new bulk corporate enquiry.
    """
    db_enquiry = models.CorporateEnquiry(
        client_id=current_user.id if current_user.role == "client" else None,
        company_name=enquiry_in.company_name,
        email=enquiry_in.email,
        phone=enquiry_in.phone,
        quantity=enquiry_in.quantity,
        hamper_details=enquiry_in.hamper_details,
        status="Received",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_enquiry)
    db.commit()
    db.refresh(db_enquiry)
    return db_enquiry

@app.get("/api/corporate-enquiries", response_model=List[schemas.CorporateEnquiryResponse])
def list_corporate_enquiries(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lists corporate enquiries. Clients view their own, staff view all.
    """
    if current_user.role == "client":
        return db.query(models.CorporateEnquiry).filter(models.CorporateEnquiry.client_id == current_user.id).all()
    return db.query(models.CorporateEnquiry).all()

@app.post("/api/corporate-enquiries/{enquiry_id}/proposal", response_model=schemas.CorporateEnquiryResponse)
def submit_corporate_proposal(
    enquiry_id: int,
    proposal: schemas.CorporateEnquiryProposalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Submits a price proposal for a corporate enquiry (staff only).
    """
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can submit corporate proposals"
        )
    db_enquiry = db.query(models.CorporateEnquiry).filter(models.CorporateEnquiry.id == enquiry_id).first()
    if not db_enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Corporate enquiry not found"
        )
    db_enquiry.proposal_price = proposal.proposal_price
    db_enquiry.proposal_notes = proposal.proposal_notes
    db_enquiry.status = "Proposal Sent"
    db.commit()
    db.refresh(db_enquiry)
    return db_enquiry

@app.post("/api/corporate-enquiries/{enquiry_id}/approve", response_model=schemas.CorporateEnquiryResponse)
def approve_corporate_proposal(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Approves a corporate proposal (client or staff).
    """
    db_enquiry = db.query(models.CorporateEnquiry).filter(models.CorporateEnquiry.id == enquiry_id).first()
    if not db_enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Corporate enquiry not found"
        )
    if current_user.role == "client" and db_enquiry.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve this proposal"
        )
    db_enquiry.status = "Approved"
    db.commit()
    db.refresh(db_enquiry)
    return db_enquiry


# --- Return Request Portal Endpoints ---
@app.post("/api/returns", response_model=schemas.ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
def create_return_request(
    return_in: schemas.ReturnRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Files a return request for a delivered order.
    """
    order = db.query(models.Order).filter(models.Order.id == return_in.order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    if current_user.role == "client":
        if order.client_id != current_user.id and order.customer_email != current_user.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to file return for this order"
            )
            
    # Check if return already exists
    existing = db.query(models.ReturnRequest).filter(models.ReturnRequest.order_id == return_in.order_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return request already submitted for this order"
        )

    db_return = models.ReturnRequest(
        order_id=return_in.order_id,
        client_id=order.client_id or current_user.id,
        reason=return_in.reason,
        details=return_in.details,
        status="Pending Review",
        created_at=datetime.datetime.utcnow()
    )
    db.add(db_return)
    db.commit()
    db.refresh(db_return)
    return db_return

@app.get("/api/returns", response_model=List[schemas.ReturnRequestResponse])
def list_return_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lists return requests. Clients view their own, staff view all.
    """
    if current_user.role == "client":
        return db.query(models.ReturnRequest).filter(models.ReturnRequest.client_id == current_user.id).all()
    return db.query(models.ReturnRequest).all()

@app.post("/api/returns/{return_id}/status", response_model=schemas.ReturnRequestResponse)
def update_return_status(
    return_id: int,
    status_update: schemas.ReturnRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Approves or refunds a return request (staff only).
    """
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can process returns"
        )
    db_return = db.query(models.ReturnRequest).filter(models.ReturnRequest.id == return_id).first()
    if not db_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )
    db_return.status = status_update.status
    db.commit()
    db.refresh(db_return)
    return db_return


# --- Admin CSV Export Reports ---
import csv
import io
from fastapi.responses import StreamingResponse

@app.get("/api/reports/csv")
def export_orders_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Exports all order records as a CSV document (staff only).
    """
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can export CSV reports"
        )
        
    orders = db.query(models.Order).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header
    writer.writerow([
        "Order ID", "Customer Name", "Customer Email", "Recipient Name", "Recipient Address",
        "Product Name", "Order Type", "Custom Engraving Name", "Card Message Draft",
        "Workflow Status", "Packaging Material", "Greeting Card Theme", "Special Instructions",
        "AI Recommendation Brief", "Created At", "Updated At"
    ])
    
    for o in orders:
        writer.writerow([
            o.id,
            o.customer_name,
            o.customer_email,
            o.recipient_name,
            o.recipient_address,
            o.product_name,
            o.order_type,
            o.custom_name or "",
            o.text_message or "",
            o.status,
            o.packaging_material or "",
            o.greeting_card or "",
            o.special_instructions or "",
            o.ai_recommendation or "",
            o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else "",
            o.updated_at.strftime("%Y-%m-%d %H:%M:%S") if o.updated_at else ""
        ])
        
    output.seek(0)
    response = StreamingResponse(output, media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=order_workflow_report.csv"
    return response


# --- AI Recommendation Endpoint ---
@app.get("/api/ai/recommend")
def get_ai_recommendation(
    occasion: str = Query(..., min_length=1),
    recipient: str = Query(..., min_length=1),
    current_user: models.User = Depends(get_current_user)
):
    """
    Exposes the AI product recommendations engine based on occasion type and recipient.
    """
    return ai_agent.generate_product_recommendations(occasion, recipient)
