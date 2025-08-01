
# Function to swap two numbers
def swap_numbers(a, b):
    a, b = b, a
    return a, b

# Example usage
num1 = 10
num2 = 5
print("Before swapping: num1 =", num1, ", num2 =", num2)

num1, num2 = swap_numbers(num1, num2)

print("After swapping: num1 =", num1, ", num2 =", num2)
