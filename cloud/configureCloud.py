import boto3
import json
import time

cf = boto3.client('cloudformation')

stack_name = "TuckerPortfolioStack"
template_file_path = "cloudFormationTemplate.yaml"


with open(template_file_path, 'r') as f:
    template_body = f.read()


def stack_exists(name):
    try:
        cf.describe_stacks(StackName=name)
        return True
    except cf.exceptions.ClientError as e:
        if "does not exist" in str(e):
            return False
        raise


try:
    if stack_exists(stack_name):
        print(f"Updating stack: {stack_name}")
        response = cf.update_stack(
            StackName=stack_name,
            TemplateBody=template_body
        )
    else:
        print(f"Creating stack: {stack_name}")
        response = cf.create_stack(
            StackName=stack_name,
            TemplateBody=template_body
        )
    print("Stack operation started. Waiting for completion...")

    waiter = cf.get_waiter('stack_update_complete' if stack_exists(stack_name) else 'stack_create_complete')
    waiter.wait(StackName=stack_name)

    print("Stack deployed successfully.")

except cf.exceptions.ClientError as e:
    if "No updates are to be performed" in str(e):
        print("No changes detected in the template.")
    else:
        print("Stack operation failed:", e)