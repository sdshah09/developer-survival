import json
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from schemas.chat import ChatRequest

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


def sse(chunk: dict) -> bytes:
    return f"data: {json.dumps(chunk)}\n\n".encode()


@router.post("")
async def send_message(body: ChatRequest, request: Request):
    chat_client = request.app.state.chat_client
    last_user_text = body.messages[-1].parts[0].text

    async def generate():
        msg_id = f"msg_{uuid.uuid4().hex[:8]}"
        text_id = f"t_{uuid.uuid4().hex[:8]}"

        yield sse({"type": "start", "messageId": msg_id})
        yield sse({"type": "start-step"})
        yield sse({"type": "text-start", "id": text_id})

        async for delta in chat_client.send_message(last_user_text):
            yield sse({"type": "text-delta", "id": text_id, "delta": delta})

        yield sse({"type": "text-end", "id": text_id})
        yield sse({"type": "finish-step"})
        yield sse({"type": "finish"})
        yield b"data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"x-vercel-ai-ui-message-stream": "v1"},
    )
