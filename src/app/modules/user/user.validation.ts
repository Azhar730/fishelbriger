import z from "zod";

export const createUser = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email format"),
        phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
    })
})

export const UserValidations = {
    createUser
}