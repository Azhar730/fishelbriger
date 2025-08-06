import z from "zod";

export const createAdmin = z.object({
    body: z.object({
        name: z.string(),
        phoneNumber: z.string(),
        profilePhoto: z.string().optional(),
        email: z.string(),
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
})

export const UserValidations = {
    createAdmin
}