from fastapi import APIRouter, Request

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


@router.post("")
async def send_message(message: str, request: Request):
    print(request.app)
    chat_client = request.app.state.chat_client

    response = chat_client.send_message(message)
    return {"response": response.choices[0].message.content}
