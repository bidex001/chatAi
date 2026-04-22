import os

from dotenv import load_dotenv

try:
    import openai
    from openai import AsyncOpenAI
except ImportError:
    openai = None
    AsyncOpenAI = None

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None
    genai_types = None

load_dotenv()

DEFAULT_PROVIDER = "openai"
DEFAULT_OPENAI_MODEL = "gpt-5.4-mini"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_HISTORY_LIMIT = 20
DEFAULT_SYSTEM_PROMPT = "You are ChatAI, a helpful and concise AI assistant."


class OpenAIConfigurationError(RuntimeError):
    pass


class OpenAIGenerationError(RuntimeError):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def get_provider() -> str:
    raw_value = os.getenv("AI_PROVIDER", "").strip().lower()
    if raw_value in {"openai", "gemini"}:
        return raw_value

    if os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        return "gemini"

    return DEFAULT_PROVIDER


def get_model_name() -> str:
    if get_provider() == "gemini":
        return os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    return os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)


def get_history_limit() -> int:
    raw_value = os.getenv("OPENAI_HISTORY_LIMIT", str(DEFAULT_HISTORY_LIMIT))
    try:
        value = int(raw_value)
    except ValueError:
        return DEFAULT_HISTORY_LIMIT
    return max(1, min(value, 100))


def _get_system_prompt() -> str:
    return os.getenv("OPENAI_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT)


def _ensure_openai_sdk() -> None:
    if openai is None or AsyncOpenAI is None:
        raise OpenAIConfigurationError(
            "openai package is not installed. Run `pip install openai`."
        )


def _ensure_gemini_sdk() -> None:
    if genai is None or genai_types is None:
        raise OpenAIConfigurationError(
            "google-genai package is not installed. Run `pip install google-genai`."
        )


def _extract_openai_error_message(exc: Exception) -> str | None:
    body = getattr(exc, "body", None)
    if not isinstance(body, dict):
        return None

    error = body.get("error")
    if not isinstance(error, dict):
        return None

    message = error.get("message")
    code = error.get("code")

    if not message:
        return None

    if code:
        return f"{message} ({code})"

    return message


def _extract_status_code(exc: Exception) -> int | None:
    for attr_name in ("status_code", "status", "code"):
        value = getattr(exc, attr_name, None)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)

    response = getattr(exc, "response", None)
    if response is None:
        return None

    for attr_name in ("status_code", "status"):
        value = getattr(response, attr_name, None)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)

    return None


def _extract_gemini_error_message(exc: Exception) -> str | None:
    message = getattr(exc, "message", None)
    if isinstance(message, str) and message.strip():
        return message.strip()

    response = getattr(exc, "response", None)
    if response is not None:
        body = getattr(response, "body", None)
        if isinstance(body, dict):
            error = body.get("error")
            if isinstance(error, dict):
                error_message = error.get("message")
                if isinstance(error_message, str) and error_message.strip():
                    return error_message.strip()

        text = getattr(response, "text", None)
        if isinstance(text, str) and text.strip():
            return text.strip()

    text = str(exc).strip()
    return text or None


def _build_openai_input(history: list[dict[str, str]]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []

    for item in history:
        role = item.get("role")
        content = item.get("content", "").strip()

        if role not in {"user", "assistant"} or not content:
            continue

        messages.append({"role": role, "content": content})

    return messages


def _build_gemini_input(history: list[dict[str, str]]) -> list[dict[str, object]]:
    contents: list[dict[str, object]] = []

    for item in history:
        role = item.get("role")
        content = item.get("content", "").strip()

        if role not in {"user", "assistant"} or not content:
            continue

        contents.append(
            {
                "role": "user" if role == "user" else "model",
                "parts": [{"text": content}],
            }
        )

    return contents


async def _generate_openai_reply(history: list[dict[str, str]]) -> str:
    _ensure_openai_sdk()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise OpenAIConfigurationError("OPENAI_API_KEY is not set.")

    input_messages = _build_openai_input(history)
    if not input_messages:
        raise OpenAIGenerationError("No conversation history was provided.")

    try:
        async with AsyncOpenAI(api_key=api_key) as client:
            response = await client.responses.create(
                model=get_model_name(),
                instructions=_get_system_prompt(),
                input=input_messages,
            )
    except openai.RateLimitError as exc:
        error_message = _extract_openai_error_message(exc)
        raise OpenAIGenerationError(
            error_message or "OpenAI rate limit reached. Try again shortly.",
            status_code=429,
        ) from exc
    except openai.APIConnectionError as exc:
        raise OpenAIGenerationError(
            "Could not connect to OpenAI.",
            status_code=502,
        ) from exc
    except openai.APIStatusError as exc:
        error_message = _extract_openai_error_message(exc)
        raise OpenAIGenerationError(
            error_message or f"OpenAI request failed with status {exc.status_code}.",
            status_code=exc.status_code or 502,
        ) from exc
    except openai.APIError as exc:
        error_message = _extract_openai_error_message(exc)
        raise OpenAIGenerationError(
            error_message or "OpenAI request failed.",
            status_code=502,
        ) from exc

    output_text = (response.output_text or "").strip()
    if not output_text:
        raise OpenAIGenerationError("OpenAI returned an empty reply.")

    return output_text


async def _generate_gemini_reply(history: list[dict[str, str]]) -> str:
    _ensure_gemini_sdk()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise OpenAIConfigurationError("GEMINI_API_KEY is not set.")

    contents = _build_gemini_input(history)
    if not contents:
        raise OpenAIGenerationError("No conversation history was provided.")

    client = genai.Client(api_key=api_key)

    try:
        response = await client.aio.models.generate_content(
            model=get_model_name(),
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=_get_system_prompt(),
            ),
        )
    except Exception as exc:
        raise OpenAIGenerationError(
            _extract_gemini_error_message(exc) or "Gemini request failed.",
            status_code=_extract_status_code(exc) or 502,
        ) from exc
    finally:
        await client.aio.aclose()

    output_text = (getattr(response, "text", "") or "").strip()
    if not output_text:
        raise OpenAIGenerationError("Gemini returned an empty reply.")

    return output_text


async def generate_reply(history: list[dict[str, str]]) -> str:
    if get_provider() == "gemini":
        return await _generate_gemini_reply(history)

    return await _generate_openai_reply(history)
