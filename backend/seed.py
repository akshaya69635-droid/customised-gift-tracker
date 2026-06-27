import datetime
from database import engine, SessionLocal, Base
import models
import workflow

def seed_database(drop_all: bool = True):
    # Re-create tables
    if drop_all:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding database with products, users, and orders...")

        now = datetime.datetime.utcnow()

        # Seed default products
        products = [
            models.Product(name="Engraved Cherrywood Notebook", base_price=25.00, description="Classic cherrywood engraved spiral notebook", category="Notebook"),
            models.Product(name="Embossed Leather Journal", base_price=45.00, description="Genuine leather refillable notebook with custom debossing", category="Journal"),
            models.Product(name="Custom Resin Paperweight", base_price=35.00, description="Preserve custom elements/photos in transparent crystal resin", category="Resin"),
            models.Product(name="Engraved Arc Reactor Desk Clock", base_price=75.00, description="Futuristic illuminated desk clock with customizable engraving plates", category="Clock"),
            models.Product(name="Monogrammed Leather Travel Bag", base_price=120.00, description="Spacious cabin-sized weekender duffle bag in full-grain leather", category="Bag")
        ]
        db.add_all(products)
        db.commit()

        # Seed default admin user
        from auth import get_password_hash
        admin_user = models.User(
            email="admin@paperplane.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin Director",
            role="staff",
            created_at=now
        )
        db.add(admin_user)

        # Seed default client user
        client_user = models.User(
            email="client@example.com",
            hashed_password=get_password_hash("client123"),
            full_name="Alice Vance",
            role="client",
            created_at=now
        )
        db.add(client_user)
        db.commit()
        db.refresh(client_user)

        # 1. Order that is STUCK in 'Design Approval' (Threshold 48 hours, updating to 3 days ago)
        stuck_design_approval = models.Order(
            customer_name="Alice Vance",
            customer_email="client@example.com",
            client_id=client_user.id,
            recipient_name="Grace Vance",
            recipient_address="123 Blossom Lane, Seattle, WA 98101",
            product_name="Engraved Cherrywood Notebook",
            order_type="Personalized Gift",
            custom_name="GRACE",
            text_message="To new beginnings and beautiful stories.",
            photo_url="https://images.unsplash.com/photo-1544816155-12df9643f363?w=500",
            status=workflow.STAGE_DESIGN_APPROVAL,
            packaging_material="Signature Gold Foil",
            greeting_card="Birthday Theme",
            special_instructions="Please make the engraving size 24px.",
            ai_recommendation="💡 AI Studio Assistant:\nLayout mockup is complete. Action required by Client to click 'Approve Mockup' to release printing queue.",
            created_at=now - datetime.timedelta(days=4),
            updated_at=now - datetime.timedelta(days=3)  # Stuck for 72 hours
        )
        db.add(stuck_design_approval)
        db.commit()
        db.refresh(stuck_design_approval)

        db.add_all([
            models.OrderHistory(
                order_id=stuck_design_approval.id,
                status=workflow.STAGE_DESIGN_RECEIVED,
                notes="Order placed. Cherrywood selected.",
                owner="System",
                updated_at=now - datetime.timedelta(days=4)
            ),
            models.OrderHistory(
                order_id=stuck_design_approval.id,
                status=workflow.STAGE_DESIGN_APPROVAL,
                notes="Mockup draft #1 sent. Customer requested slightly larger font on engraving.",
                owner="Sarah (Design)",
                updated_at=now - datetime.timedelta(days=3.5)
            ),
            models.OrderHistory(
                order_id=stuck_design_approval.id,
                status=workflow.STAGE_DESIGN_APPROVAL,
                notes="Revised mockup draft #2 sent. Awaiting feedback from client.",
                owner="Sarah (Design)",
                updated_at=now - datetime.timedelta(days=3)
            )
        ])

        # 2. Order that is STUCK in 'Design Received' (Threshold 24 hours, updating to 30 hours ago)
        stuck_design_received = models.Order(
            customer_name="Marcus Aurelius",
            customer_email="marcus.stoic@rome.org",
            recipient_name="Lucius Verus",
            recipient_address="Palatine Hill, Rome, IT 00186",
            product_name="Embossed Leather Journal",
            order_type="Corporate Bundle",
            custom_name="MEDITATIONS",
            text_message="Waste no more time arguing about what a good man should be. Be one.",
            photo_url="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
            status=workflow.STAGE_DESIGN_RECEIVED,
            packaging_material="Recycled Craft Box",
            greeting_card="Congratulations Card",
            special_instructions="Pack carefully in eco-friendly material.",
            ai_recommendation="💡 AI Studio Assistant:\nOrder has been registered. Designers are advised to select font size '24px Script' for engraving the name 'MEDITATIONS'.",
            created_at=now - datetime.timedelta(hours=30),
            updated_at=now - datetime.timedelta(hours=30)  # Stuck for 30 hours
        )
        db.add(stuck_design_received)
        db.commit()
        db.refresh(stuck_design_received)

        db.add(models.OrderHistory(
            order_id=stuck_design_received.id,
            status=workflow.STAGE_DESIGN_RECEIVED,
            notes="Order registered automatically. High priority corporate client.",
            owner="System",
            updated_at=now - datetime.timedelta(hours=30)
        ))

        # 3. Healthy Order in 'Printing' (Threshold 36 hours, updated 6 hours ago)
        printing_order = models.Order(
            customer_name="Emily Blunt",
            customer_email="emily@blunt.co.uk",
            recipient_name="John Krasinski",
            recipient_address="456 Quiet Place, Brooklyn, NY 11201",
            product_name="Custom Resin Paperweight",
            order_type="Personalized Gift",
            custom_name="J & E 2026",
            text_message="A quiet moment captured in glass.",
            photo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500",
            status=workflow.STAGE_PRINTING,
            packaging_material="Premium Satin Bag",
            greeting_card="Thank You Theme",
            special_instructions="Gift wrap it with a blue ribbon.",
            ai_recommendation="💡 AI Studio Assistant:\nDesign approved. Production queue suggests laser-etching on low-speed power index (Power: 40%, Speed: 25%) to preserve material finish.",
            created_at=now - datetime.timedelta(days=1),
            updated_at=now - datetime.timedelta(hours=6)
        )
        db.add(printing_order)
        db.commit()
        db.refresh(printing_order)

        db.add_all([
            models.OrderHistory(
                order_id=printing_order.id,
                status=workflow.STAGE_DESIGN_RECEIVED,
                notes="Resin configuration validated.",
                owner="System",
                updated_at=now - datetime.timedelta(days=1)
            ),
            models.OrderHistory(
                order_id=printing_order.id,
                status=workflow.STAGE_DESIGN_APPROVAL,
                notes="Mockup approved immediately via email link.",
                owner="Emily (Customer)",
                updated_at=now - datetime.timedelta(hours=10)
            ),
            models.OrderHistory(
                order_id=printing_order.id,
                status=workflow.STAGE_PRINTING,
                notes="transferred files to printer queue #B",
                owner="Gavin (Production)",
                updated_at=now - datetime.timedelta(hours=6)
            )
        ])

        # 4. Healthy Order in 'Packing' (Threshold 24 hours, updated 2 hours ago)
        packing_order = models.Order(
            customer_name="Tony Stark",
            customer_email="tony@starkindustries.com",
            recipient_name="Pepper Potts",
            recipient_address="10880 Malibu Point, Malibu, CA 90265",
            product_name="Engraved Arc Reactor Desk Clock",
            order_type="Personalized Gift",
            custom_name="PROOF THAT TONY HAS A HEART",
            text_message="I love you 3000.",
            photo_url="",
            status=workflow.STAGE_PACKING,
            packaging_material="Signature Gold Foil",
            greeting_card="Love & Anniversary",
            special_instructions="Include a special card note.",
            ai_recommendation="💡 AI Studio Assistant:\nCustomization finished. Wrapping recommends utilizing 'Kraft Box' or 'Gold Foil Wrapper' depending on occasion priority.",
            created_at=now - datetime.timedelta(days=2),
            updated_at=now - datetime.timedelta(hours=2)
        )
        db.add(packing_order)
        db.commit()
        db.refresh(packing_order)

        db.add_all([
            models.OrderHistory(
                order_id=packing_order.id,
                status=workflow.STAGE_DESIGN_RECEIVED,
                notes="Advanced electronic circuits details attached.",
                owner="System",
                updated_at=now - datetime.timedelta(days=2)
            ),
            models.OrderHistory(
                order_id=packing_order.id,
                status=workflow.STAGE_DESIGN_APPROVAL,
                notes="Approval confirmed by assistant JARVIS.",
                owner="JARVIS (System)",
                updated_at=now - datetime.timedelta(days=1)
            ),
            models.OrderHistory(
                order_id=packing_order.id,
                status=workflow.STAGE_PRINTING,
                notes="Laser etching complete. Finish looks flawless.",
                owner="Gavin (Production)",
                updated_at=now - datetime.timedelta(hours=8)
            ),
            models.OrderHistory(
                order_id=packing_order.id,
                status=workflow.STAGE_PACKING,
                notes="Item has cleared quality check. Now wrapping in custom gold-titanium ribbon.",
                owner="Helen (Packing)",
                updated_at=now - datetime.timedelta(hours=2)
            )
        ])

        # 5. Healthy Order in 'Delivery' (Threshold 72 hours, updated 1 hour ago)
        delivery_order = models.Order(
            customer_name="Bruce Wayne",
            customer_email="bruce@waynecorp.com",
            recipient_name="Alfred Pennyworth",
            recipient_address="Wayne Manor, Gotham City, NJ 07001",
            product_name="Monogrammed Leather Travel Bag",
            order_type="Personalized Gift",
            custom_name="A.P.",
            text_message="Thank you for always catching us when we fall.",
            photo_url="",
            status=workflow.STAGE_DELIVERY,
            packaging_material="Recycled Craft Box",
            greeting_card="Thank You Theme",
            special_instructions="Deliver before Friday evening.",
            ai_recommendation="💡 AI Studio Assistant:\nShipped. Automated tracking reminder sent to client's email.",
            created_at=now - datetime.timedelta(days=3),
            updated_at=now - datetime.timedelta(hours=1)
        )
        db.add(delivery_order)
        db.commit()
        db.refresh(delivery_order)

        db.add_all([
            models.OrderHistory(
                order_id=delivery_order.id,
                status=workflow.STAGE_DESIGN_RECEIVED,
                notes="Order received.",
                owner="System",
                updated_at=now - datetime.timedelta(days=3)
            ),
            models.OrderHistory(
                order_id=delivery_order.id,
                status=workflow.STAGE_DESIGN_APPROVAL,
                notes="Design mockup approved.",
                owner="Alfred (Customer)",
                updated_at=now - datetime.timedelta(days=2)
            ),
            models.OrderHistory(
                order_id=delivery_order.id,
                status=workflow.STAGE_PRINTING,
                notes="Debossing of initials completed.",
                owner="Gavin (Production)",
                updated_at=now - datetime.timedelta(days=1)
            ),
            models.OrderHistory(
                order_id=delivery_order.id,
                status=workflow.STAGE_PACKING,
                notes="Packed in high-security shipping crate.",
                owner="Helen (Packing)",
                updated_at=now - datetime.timedelta(hours=5)
            ),
            models.OrderHistory(
                order_id=delivery_order.id,
                status=workflow.STAGE_DELIVERY,
                notes="Shipped via Wayne Enterprises Private Courier. Tracking #BAT-999-STORK.",
                owner="Alfred (System)",
                updated_at=now - datetime.timedelta(hours=1)
            )
        ])
        db.commit()

        # Seed Client Occasions
        occasions = [
            models.Occasion(client_id=client_user.id, occasion_name="Wife's Birthday", recipient_name="Grace Vance", date="2026-07-14", status="Pending", created_at=now),
            models.Occasion(client_id=client_user.id, occasion_name="Parents Anniversary", recipient_name="John & Mary Vance", date="2026-06-25", status="Pending", created_at=now)
        ]
        db.add_all(occasions)

        # Seed Corporate Enquiries
        enquiries = [
            models.CorporateEnquiry(
                client_id=client_user.id,
                company_name="Wayne Enterprises",
                email="bruce@waynecorp.com",
                phone="555-0199",
                quantity=150,
                hamper_details="Deluxe Wayne Manor Stationery and Resin Desk Set",
                status="Received",
                created_at=now - datetime.timedelta(days=1)
            ),
            models.CorporateEnquiry(
                client_id=client_user.id,
                company_name="Stark Industries",
                email="tony@starkindustries.com",
                phone="555-3000",
                quantity=50,
                hamper_details="Arc Reactor Monogrammed Leather Notebooks",
                proposal_price=3750.00,
                proposal_notes="Bespoke cherrywood and gold inlay engraving, includes congratulations card.",
                status="Proposal Sent",
                created_at=now - datetime.timedelta(days=2)
            )
        ]
        db.add_all(enquiries)

        # Seed Return Request
        return_req = models.ReturnRequest(
            order_id=delivery_order.id,
            client_id=client_user.id,
            reason="Incorrect engraving spelling",
            details="Engraving spelling is AP, expected Alfred.",
            status="Pending Review",
            created_at=now - datetime.timedelta(hours=12)
        )
        db.add(return_req)

        db.commit()
        print("Database successfully seeded with 5 mock orders, products, occasions, enquiries, and returns!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
