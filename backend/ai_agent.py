from typing import Dict, Any

def generate_card_recommendation(product_name: str, custom_name: str, client_message: str) -> str:
    """
    Generates rule-based AI recommendations for personalized card messages.
    """
    name_phrase = f" {custom_name}" if custom_name else ""
    client_phrase = f" \"{client_message}\"" if client_message else " a beautiful day ahead"
    
    if "notebook" in product_name.lower() or "journal" in product_name.lower():
        return (
            f"✍️ Recommendation for Journal:\n"
            f"Draft 1: \"To{name_phrase}, may every page of this custom journal be filled with "
            f"your most brilliant ideas and happiest memories. {client_phrase.strip(' \"')}.\"\n\n"
            f"Draft 2: \"Write your own future,{name_phrase}. Crafted especially for you. {client_message or 'With warm regards.'}\""
        )
    elif "paperweight" in product_name.lower():
        return (
            f"✨ Recommendation for Resin Glass Paperweight:\n"
            f"Draft 1: \"A moment frozen in glass. To{name_phrase}, to keep your workspace "
            f"anchored and your dreams soaring. {client_message or 'With love.'}\""
        )
    elif "clock" in product_name.lower():
        return (
            f"⏰ Recommendation for Custom Clock:\n"
            f"Draft 1: \"To{name_phrase}, marking the beautiful moments we've shared and the "
            f"timeless memories yet to come. {client_message or 'Happy celebrations!'}\""
        )
    else:
        return (
            f"🎁 Recommendation for Customized Gifting:\n"
            f"Draft 1: \"A bespoke gift crafted especially for{name_phrase}. "
            f"May it bring a smile to your face. {client_message or 'Warmest wishes.'}\""
        )

def generate_product_recommendations(occasion_name: str, recipient_name: str) -> Dict[str, Any]:
    """
    Generates complete personalized gift bundle recommendations based on the occasion context.
    """
    occ = occasion_name.lower()
    rec = recipient_name or "their name"
    
    if "birthday" in occ:
        return {
            "recommended_product": "Embossed Leather Journal",
            "suggested_engraving": rec.upper(),
            "suggested_card": "Occasion: Birthday Theme",
            "suggested_packaging": "Signature Gold Foil Wrapper",
            "ai_reasoning": "Leather journals represent a premium, personalized birthday gift to document achievements for the year ahead.",
            "sample_card_text": f"Happy Birthday, {rec}! May this year bring you closer to all your aspirations. Here's a customized journal for your thoughts."
        }
    elif "anniversary" in occ or "love" in occ or "wife" in occ or "husband" in occ:
        return {
            "recommended_product": "Custom Resin Paperweight",
            "suggested_engraving": f"{rec} & ME",
            "suggested_card": "Occasion: Love & Anniversary",
            "suggested_packaging": "Signature Gold Foil Wrapper",
            "ai_reasoning": "Resin glass captures timeless beauty, perfect for preserving the memory of anniversary milestones.",
            "sample_card_text": f"Happy Anniversary! A timeless keepsake for a love that remains crystal clear. Together forever."
        }
    elif "corporate" in occ or "promotion" in occ or "boss" in occ or "colleague" in occ:
        return {
            "recommended_product": "Engraved Arc Reactor Desk Clock",
            "suggested_engraving": f"LEADERSHIP - {rec.upper()}",
            "suggested_card": "Occasion: Professional/Corporate",
            "suggested_packaging": "Recycled Craft Box",
            "ai_reasoning": "A desk clock symbolizes professional structure, timing, and appreciation of their leadership/contribution.",
            "sample_card_text": f"Dear {rec}, thank you for your outstanding dedication and guidance. Wishing you continued time-bound success."
        }
    else:
        return {
            "recommended_product": "Engraved Cherrywood Notebook",
            "suggested_engraving": rec.upper(),
            "suggested_card": "Occasion: Congratulations Card",
            "suggested_packaging": "Premium Satin Bag",
            "ai_reasoning": "A classic cherrywood engraved notebook is a universally appreciated bespoke gift for general occasions.",
            "sample_card_text": f"Congratulations, {rec}! Best wishes for the journey ahead."
        }

def generate_order_ai_recommendation(status: str, product_name: str, custom_name: str, client_message: str) -> str:
    """
    Generates a smart progress recommendation for the order detail screen.
    """
    card_rec = generate_card_recommendation(product_name, custom_name, client_message)
    
    if status == "Design Received":
        return f"💡 AI Studio Assistant:\nOrder has been registered. Designers are advised to select font size '24px Script' for engraving the name '{custom_name or 'None'}'.\n\n{card_rec}"
    elif status == "Design Approval":
        return f"💡 AI Studio Assistant:\nLayout mockup is complete. Action required by Client to click 'Approve Mockup' to release printing queue."
    elif status == "Printing":
        return f"💡 AI Studio Assistant:\nDesign approved. Production queue suggests laser-etching on low-speed power index (Power: 40%, Speed: 25%) to preserve material finish."
    elif status == "Packing":
        return f"💡 AI Studio Assistant:\nCustomization finished. Wrapping recommends utilizing 'Kraft Box' or 'Gold Foil Wrapper' depending on occasion priority."
    else:
        return f"💡 AI Studio Assistant:\nShipped. Automated tracking reminder sent to client's email."
