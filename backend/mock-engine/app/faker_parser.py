import re
from faker import Faker

# This regex finds everything inside {{...}}
REGEX_PATTERN = r"\{\{([^}]+)\}\}"


def parse_faker_string(body_string: str, fake: Faker) -> str:
    """
    Finds all {{Faker.provider()}} tags and replaces them with fake data.

    Example:
    Input: "{\"name\": \"{{Faker.name()}}\"}"
    Output: "{\"name\": \"John Doe\"}"
    """

    # We use a function as the second argument to re.sub
    # This function will be called for every match
    def replacer(match):
        # Get the inner part, e.g., "Faker.name()"
        faker_call = match.group(1).strip()

        # We only support simple providers for now, e.g., "Faker.name()"
        # We'll extract "name"
        if not faker_call.startswith("Faker.") or not faker_call.endswith("()"):
            # Not a valid call, return the original tag
            return match.group(0)

        # Extract the provider name, e.g., "name" from "Faker.name()"
        provider_name = faker_call[len("Faker."):-len("()")]

        try:
            # Get the actual function from the 'fake' object
            func = getattr(fake, provider_name, None)

            if callable(func):
                # Call the function (e.g., fake.name()) and return its value
                return str(func())
            else:
                # 'Faker.invalid_name()' was used
                return f"[Invalid Faker provider: {provider_name}]"
        except Exception as e:
            return f"[Error: {e}]"

    # This finds all matches and replaces them using the 'replacer' function
    return re.sub(REGEX_PATTERN, replacer, body_string)