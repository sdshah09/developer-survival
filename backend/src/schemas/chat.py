from typing import Literal

from pydantic import BaseModel


class TextPart(BaseModel):
    type: Literal["text"]
    text: str


class StepStartPart(BaseModel):
    type: Literal["step-start"]


class UIMessage(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    parts: list[TextPart | StepStartPart]


class ChatRequest(BaseModel):
    messages: list[UIMessage]
    id: str | None = None
    trigger: str | None = None
    message_id: str | None = None
