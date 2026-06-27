import datetime
from typing import Dict, Tuple

# Stage names constants
STAGE_DESIGN_RECEIVED = "Design Received"
STAGE_DESIGN_APPROVAL = "Design Approval"
STAGE_PRINTING = "Printing"
STAGE_PACKING = "Packing"
STAGE_DELIVERY = "Delivery"

# Ordered list of workflow stages for validation and transitions
WORKFLOW_STAGES = [
    STAGE_DESIGN_RECEIVED,
    STAGE_DESIGN_APPROVAL,
    STAGE_PRINTING,
    STAGE_PACKING,
    STAGE_DELIVERY
]

# Time limit in hours before an order is considered "stuck" (Priority Alert)
STAGE_THRESHOLDS_HOURS: Dict[str, float] = {
    STAGE_DESIGN_RECEIVED: 24.0,   # 1 day to create design mockup
    STAGE_DESIGN_APPROVAL: 48.0,   # 2 days to get customer approval
    STAGE_PRINTING: 36.0,          # 1.5 days to print/engrave the product
    STAGE_PACKING: 24.0,           # 1 day to pack and invoice
    STAGE_DELIVERY: 72.0,          # 3 days to deliver to final address
}

def get_next_action_brief(status: str) -> str:
    """
    Returns a rule-based advice on what staff needs to do next for a given workflow stage.
    """
    if status == STAGE_DESIGN_RECEIVED:
        return "Create design mockup and email it to the customer for review & feedback."
    elif status == STAGE_DESIGN_APPROVAL:
        return "Awaiting approval from the customer. If pending > 24h, send a gentle follow-up email."
    elif status == STAGE_PRINTING:
        return "Mockup approved. Send production files to the workshop for printing/engraving."
    elif status == STAGE_PACKING:
        return "Customization finished. Wrap item in signature packaging and apply delivery labels."
    elif status == STAGE_DELIVERY:
        return "Hand over to courier partner. Share tracking link with both buyer and recipient."
    else:
        return "Workflow completed. Archive order or verify customer receipt."

def check_priority_alert(status: str, updated_at: datetime.datetime) -> Tuple[bool, str]:
    """
    Checks if an order has been stuck in its current stage longer than the stage's threshold.
    Returns (is_priority_alert, alert_reason)
    """
    if not updated_at:
        return False, ""
    
    # Calculate difference in hours
    now = datetime.datetime.utcnow()
    delta = now - updated_at
    hours_stuck = delta.total_seconds() / 3600.0
    
    # Get threshold for the stage
    threshold = STAGE_THRESHOLDS_HOURS.get(status, 48.0)  # default 48 hours
    
    if hours_stuck > threshold:
        reason = f"Stuck in '{status}' stage for {hours_stuck:.1f} hours (Limit: {threshold}h)."
        return True, reason
        
    return False, ""
