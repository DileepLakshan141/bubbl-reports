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
import { loginSchema, LoginSchemaType } from "@/schemas/authSchema";
import { login } from "@/lib/services/login";
import { setUser } from "../../../store/authSlice";
import { useAppDispatch } from "../../../store/hooks";

const LoginPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const signinForm = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInSubmission = async (values: LoginSchemaType) => {
    try {
      setLoading(true);
      const response = await login(values);

      if (response.success && response.user) {
        dispatch(setUser(response.user));
        toast.success(response.message || "Login successful!");
        router.push("/dashboard/home");
      } else {
        toast.error(
          response.message || "Invalid credentials. Please try again.",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Login process failed. Please try again.");
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

      {/* Sign-in Form Container */}
      <div className="w-full h-screen absolute top-0 left-0 flex justify-center items-center">
        <Card className="w-full min-h-[500px] p-4 mx-4 md:max-w-[450px] flex flex-col justify-start items-center">
          <CardTitle className="text-4xl text-primary font-semibold">
            bubbl
          </CardTitle>
          <CardDescription className="w-[90%] text-center -translate-y-2">
            <span className="text-lg font-medium mb-4">
              Login to your account!
            </span>{" "}
            <br />
            Welcome back to bubbl! Pick up right where you left off and keep
            connecting with your team to track your reports.
          </CardDescription>

          <CardContent className="w-full">
            <form onSubmit={signinForm.handleSubmit(signInSubmission)}>
              <FieldGroup>
                {/* Email Field */}
                <Controller
                  name="email"
                  control={signinForm.control}
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
                  control={signinForm.control}
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
              </FieldGroup>

              <Button disabled={loading} type="submit" className="w-full mt-10">
                {loading ? "Processing..." : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <Separator className="mt-2" />

          <p className="text-muted-foreground text-sm text-center">
            Do not have an account yet?{" "}
            <Link href="/register" className="font-semibold underline">
              Create Account
            </Link>{" "}
            <br /> Developed & Maintained by bubbl &#169;2026
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
