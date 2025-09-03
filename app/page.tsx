"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const Page = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // 👇 If email confirmation is OFF, redirect directly
    toast.success("Account created!");
    router.push("/dashboard");
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(`${error.message}. Make sure to Sign up first.`);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <h1 className="text-3xl font-semibold">Shadow Light Assignment</h1>
      <div className="w-full max-w-md mt-6 flex flex-col items-center gap-4">
        <Tabs defaultValue="signup" className="max-w-md w-full">
          <TabsList className="w-full flex">
            <TabsTrigger value="signup" className="flex-1">
              Sign Up
            </TabsTrigger>
            <TabsTrigger value="signin" className="flex-1">
              Sign In
            </TabsTrigger>
          </TabsList>

          {/* SIGNUP */}
          <TabsContent className="flex flex-col gap-4" value="signup">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <Input
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            <Button onClick={handleSignUp} className="w-full">
              Sign Up
            </Button>
          </TabsContent>

          {/* SIGNIN */}
          <TabsContent className="flex flex-col gap-4" value="signin">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <Input
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
            <Button onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Page;
