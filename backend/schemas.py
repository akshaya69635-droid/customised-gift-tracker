from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import datetime

# --- Order History Schemas ---
class OrderHistoryBase(BaseModel):
    status: str
    notes: Optional[str] = None
    owner: str

class OrderHistoryCreate(OrderHistoryBase):
    pass

class OrderHistoryResponse(OrderHistoryBase):
    id: int
    order_id: int
    updated_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True


# --- Order Schemas ---
class OrderBase(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: str = Field(..., min_length=3, max_length=255)
    recipient_name: str = Field(..., min_length=1, max_length=255)
    recipient_address: str = Field(..., min_length=1)
    product_name: str = Field(..., min_length=1, max_length=255)
    order_type: str = Field(..., min_length=1, max_length=100)  # e.g., "Personalized Gift", "Corporate Bundle"
    custom_name: Optional[str] = Field(None, max_length=255)
    text_message: Optional[str] = None
    photo_url: Optional[str] = Field(None, max_length=500)
    
    # Expanded workflow customization fields
    packaging_material: Optional[str] = Field(None, max_length=255)
    greeting_card: Optional[str] = Field(None, max_length=255)
    special_instructions: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Workflow stage: 'Design Received', 'Design Approval', 'Printing', 'Packing', 'Delivery'")
    owner: str = Field("", max_length=255) # Empty owner defaults to current logged-in user name
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    status: str
    ai_recommendation: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Dynamically generated fields
    next_action_brief: Optional[str] = None
    is_priority_alert: bool = False
    alert_reason: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


# --- Order Detail (Includes History Logs) ---
class OrderDetailResponse(OrderResponse):
    history: List[OrderHistoryResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True


# --- Dashboard Statistics ---
class DashboardStats(BaseModel):
    total_orders: int
    design_received: int
    design_approval: int
    printing: int
    packing: int
    delivery: int
    priority_alerts: int


# --- User & Token Schemas ---
class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field("client", max_length=50)

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True

class UserLogin(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=100)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Product Schemas ---
class ProductResponse(BaseModel):
    id: int
    name: str
    base_price: float
    description: Optional[str] = None
    category: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


# --- Occasion Calendar Schemas ---
class OccasionBase(BaseModel):
    occasion_name: str = Field(..., min_length=1, max_length=255)
    recipient_name: str = Field(..., min_length=1, max_length=255)
    date: str = Field(..., description="Date format: YYYY-MM-DD")

class OccasionCreate(OccasionBase):
    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            dt = datetime.datetime.strptime(v, "%Y-%m-%d").date()
            if not (1900 <= dt.year <= 2100):
                raise ValueError("Year must be between 1900 and 2100")
            return v
        except ValueError as e:
            if "Year must be between" in str(e):
                raise ValueError("Year must be between 1900 and 2100.")
            raise ValueError("Invalid date format. Must be YYYY-MM-DD.")

class OccasionResponse(OccasionBase):
    id: int
    client_id: int
    status: str
    created_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True


# --- Corporate Enquiry Portal Schemas ---
class CorporateEnquiryBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: str = Field(..., min_length=5, max_length=50)
    quantity: int = Field(..., gt=0)
    hamper_details: str = Field(..., min_length=1)

class CorporateEnquiryCreate(CorporateEnquiryBase):
    pass

class CorporateEnquiryProposalUpdate(BaseModel):
    proposal_price: float = Field(..., gt=0)
    proposal_notes: str = Field(..., min_length=1)

class CorporateEnquiryResponse(CorporateEnquiryBase):
    id: int
    client_id: Optional[int] = None
    proposal_price: Optional[float] = None
    proposal_notes: Optional[str] = None
    status: str
    created_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True


# --- Return Request Schemas ---
class ReturnRequestBase(BaseModel):
    order_id: int
    reason: str = Field(..., min_length=1, max_length=255)
    details: Optional[str] = None

class ReturnRequestCreate(ReturnRequestBase):
    pass

class ReturnRequestStatusUpdate(BaseModel):
    status: str = Field(..., description="Stage: 'Approved' or 'Refunded' or 'Rejected'")

class ReturnRequestResponse(ReturnRequestBase):
    id: int
    client_id: int
    status: str
    created_at: datetime.datetime

    class Config:
        orm_mode = True
        from_attributes = True
