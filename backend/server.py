from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Cake Ordering API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ─── Models ──────────────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class CakeItem(BaseModel):
    """A single cake available in the menu"""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str          # e.g. "Birthday", "Wedding", "Custom"
    image_url: Optional[str] = None
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CakeItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    available: bool = True


class OrderItem(BaseModel):
    cake_id: str
    cake_name: str
    quantity: int
    unit_price: float
    subtotal: float


class Order(BaseModel):
    """A customer cake order"""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[OrderItem]
    total_price: float
    delivery_address: str
    delivery_date: str           # ISO date string e.g. "2025-01-20"
    special_instructions: Optional[str] = None
    status: str = "pending"      # pending | confirmed | baking | ready | delivered | cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    items: List[OrderItem]
    total_price: float
    delivery_address: str
    delivery_date: str
    special_instructions: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str


# ─── Status / Health ─────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Cake Ordering API is running 🎂"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ─── Cake Menu ───────────────────────────────────────────────────────────────

@api_router.get("/cakes", response_model=List[CakeItem])
async def get_cakes(category: Optional[str] = None, available_only: bool = True):
    """List all cakes, optionally filtered by category or availability."""
    query: dict = {}
    if available_only:
        query["available"] = True
    if category:
        query["category"] = category
    cakes = await db.cakes.find(query, {"_id": 0}).to_list(200)
    for cake in cakes:
        if isinstance(cake.get('created_at'), str):
            cake['created_at'] = datetime.fromisoformat(cake['created_at'])
    return cakes


@api_router.get("/cakes/{cake_id}", response_model=CakeItem)
async def get_cake(cake_id: str):
    cake = await db.cakes.find_one({"id": cake_id}, {"_id": 0})
    if not cake:
        raise HTTPException(status_code=404, detail="Cake not found")
    if isinstance(cake.get('created_at'), str):
        cake['created_at'] = datetime.fromisoformat(cake['created_at'])
    return cake


@api_router.post("/cakes", response_model=CakeItem)
async def create_cake(input: CakeItemCreate):
    """Add a new cake to the menu (admin use)."""
    cake = CakeItem(**input.model_dump())
    doc = cake.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.cakes.insert_one(doc)
    logger.info(f"New cake added: {cake.name}")
    return cake


@api_router.put("/cakes/{cake_id}", response_model=CakeItem)
async def update_cake(cake_id: str, input: CakeItemCreate):
    existing = await db.cakes.find_one({"id": cake_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Cake not found")
    update_data = input.model_dump()
    await db.cakes.update_one({"id": cake_id}, {"$set": update_data})
    updated = await db.cakes.find_one({"id": cake_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.delete("/cakes/{cake_id}")
async def delete_cake(cake_id: str):
    result = await db.cakes.delete_one({"id": cake_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cake not found")
    return {"message": "Cake deleted successfully"}


# ─── Orders ──────────────────────────────────────────────────────────────────

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    """Place a new cake order."""
    order = Order(**input.model_dump())
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    logger.info(f"New order placed: {order.id} by {order.customer_name}")
    return order


@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    """List all orders, optionally filtered by status (admin use)."""
    query: dict = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order


@api_router.patch("/orders/{order_id}/status", response_model=Order)
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """Update an order's status (admin use)."""
    valid_statuses = {"pending", "confirmed", "baking", "ready", "delivered", "cancelled"}
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": update.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    logger.info(f"Order {order_id} status updated to: {update.status}")
    return order


@api_router.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] in ("delivered",):
        raise HTTPException(status_code=400, detail="Cannot cancel a delivered order")
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"}})
    return {"message": "Order cancelled successfully"}


# ─── App setup ───────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()