import {z} from "zod";

export const RegisterationSchema = z.object({
    username: z.string(),
    email: z.email(),
    password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(20, 'Password cannot be longer than 20 characters.')
    .regex(/\d/, 'Password must contain at least one number.'),
    passwordAgain: z.string()
})
.refine(
    (data) => data.password === data.passwordAgain, 
    {
        error : 'Passwords do not match',
        path: ['passwordAgain']
    }
)

export type RegisterForm = z.infer<typeof RegisterationSchema>;


export const LoginSchema = z.object({
    email: z.email().max(30, 'The email must not exceed 30 characters'),
    password: z.string()
    .min(8, 'Password cannot be shorter than 8 characters.')
    .max(20, 'Password cannot be longer than 20 characters.')
})

export type LoginForm = z.infer<typeof LoginSchema>
