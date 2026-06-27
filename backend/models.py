import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    recipient_address = Column(Text, nullable=False)
    product_name = Column(String(255), nullable=False)
    order_type = Column(String(100), nullable=False)  # e.g., "Personalized Gift", "Corporate Bundle"
    custom_name = Column(String(255), nullable=True)   # Name to engrave or print
    text_message = Column(Text, nullable=True)          # Message to include
    photo_url = Column(String(500), nullable=True)         # Custom image reference
    status = Column(String(100), default="Design Received", nullable=False)
    
    # Expanded workflow fields
    packaging_material = Column(String(255), nullable=True) # e.g., "Signature Gold Foil", "Craft Box"
    greeting_card = Column(String(255), nullable=True)      # e.g., "Congratulations", "Thank You"
    special_instructions = Column(Text, nullable=True)       # Customer notes
    ai_recommendation = Column(Text, nullable=True)          # Personalization progress suggestions

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationship to history logs
    history = relationship("OrderHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderHistory.updated_at.desc()")
    
    # Relationship to user/client
    client_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    client = relationship("User", back_populates="orders")

class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    owner = Column(String(255), nullable=False)  # Staff member who updated the status
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="history")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="client", nullable=False) # "staff" or "client"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationship to client orders
    orders = relationship("Order", back_populates="client")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    base_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)

class Occasion(Base):
    __tablename__ = "occasions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    occasion_name = Column(String(255), nullable=False) # e.g., "Father's Day", "Wife Birthday"
    recipient_name = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)          # Date format: YYYY-MM-DD
    status = Column(String(50), default="Pending", nullable=False) # "Pending", "Notified"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class CorporateEnquiry(Base):
    __tablename__ = "corporate_enquiries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    company_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    hamper_details = Column(Text, nullable=False)      # Hamper spec description
    proposal_price = Column(Float, nullable=True)       # Price proposal submitted by staff
    proposal_notes = Column(Text, nullable=True)       # Staff pitch/proposal notes
    status = Column(String(100), default="Received", nullable=False) # "Received", "Proposal Sent", "Approved"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(100), default="Pending Review", nullable=False) # "Pending Review", "Approved", "Refunded"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
