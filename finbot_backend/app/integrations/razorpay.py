import razorpay
from app.core.config import settings


client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_SECRET)
)


def create_order(amount: int, currency: str = "INR") -> dict:

    order = client.order.create({
        "amount": amount,
        "currency": currency,
        "payment_capture": 1,
    })
    return order


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> None:

    client.utility.verify_payment_signature({
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    })
