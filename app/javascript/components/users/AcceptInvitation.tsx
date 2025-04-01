import React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { put } from "@rails/request.js";

interface AcceptInvitationForm {
  password: string;
  password_confirmation: string;
}

interface InvitationResponse {
  success: boolean;
  message?: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AcceptInvitationForm>();

  const navigate = useNavigate();

  const onSubmit = async (data: AcceptInvitationForm) => {
    try {
      const response = await put("/users/invitation", {
        responseKind: "json",
        body: JSON.stringify({
          user: {
            invitation_token: invitationToken,
            password: data.password,
            password_confirmation: data.password_confirmation,
          }
        })
      });

      const result = await response.json as InvitationResponse;
      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation accepted successfully",
        });

        // Redirect to home after successful acceptance
        navigate("/users/sign_in");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to accept invitation",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while accepting the invitation",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            Please set your password to accept the invitation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                {...register("password_confirmation", {
                  required: "Please confirm your password",
                  validate: (val: string) => {
                    if (watch("password") !== val) {
                      return "Passwords do not match";
                    }
                  },
                })}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-red-500">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Accept Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
