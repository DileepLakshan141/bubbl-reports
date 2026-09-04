"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { registerSchema, RegisterSchemaType } from "@/schemas/authSchema";
import { register } from "@/lib/services/register";
import { useAppDispatch } from "../../../store/hooks";
import { setUser } from "../../../store/authSlice";

const RegisterPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const registerForm = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signUpSubmission = async (values: RegisterSchemaType) => {
    try {
      setLoading(true);
      const response = await register(values);

      if (response.success && response.user) {
        dispatch(setUser(response.user));
        toast.success(response.message || "Account created successfully!");
        router.push("/dashboard/home");
      } else {
        toast.error(
          response.message || "Registration failed. Please try again.",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Registration process failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen relative">
      {/* Video Container */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full absolute top-0 left-0 object-cover"
      >
        <source className="w-full" src="/buglite_back1.mp4" type="video/mp4" />
      </video>

      {/* Sign-up Form Container */}
      <div className="w-full h-screen absolute top-0 left-0 flex justify-center items-center">
        <Card className="w-full min-h-[500px] p-4 mx-4 md:max-w-[450px] flex flex-col justify-start items-center">
          <CardTitle className="text-4xl text-primary font-semibold">
            bubbl
          </CardTitle>
          <CardDescription className="w-[90%] text-center -translate-y-2">
            <span className="text-lg font-medium mb-4">
              Create your account!
            </span>{" "}
            <br />
            Join bubbl today to start collaborating with your team and tracking
            your bug reports seamlessly.
          </CardDescription>

          <CardContent className="w-full">
            <form onSubmit={registerForm.handleSubmit(signUpSubmission)}>
              <FieldGroup>
                {/* Username Field */}
                <Controller
                  name="username"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <Input
                        {...field}
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Email Field */}
                <Controller
                  name="email"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="Email Address"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Password Field */}
                <Controller
                  name="password"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Confirm Password Field */}
                <Controller
                  name="confirmPassword"
                  control={registerForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button disabled={loading} type="submit" className="w-full mt-6">
                {loading ? "Processing..." : "Create Account"}
              </Button>
            </form>
          </CardContent>

          <Separator className="mt-2" />

          <p className="text-muted-foreground text-sm text-center">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold underline">
              Sign In
            </Link>{" "}
            <br /> Developed & Maintained by bubbl &#169;2026
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
