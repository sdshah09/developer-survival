import os

from openai import OpenAI


class Chat:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"), base_url=os.getenv("AI_BASE_URL")
        )

    def send_message(self, message: str) -> str:
        """
        Send message to AI model
        """
        response = self.client.chat.completions.create(
            model="deepseek-v4-flash",
            messages=[
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": message},
            ],
            stream=False,
            reasoning_effort="high",
            extra_body={"thinking": {"type": "enabled"}},
        )
        return response
