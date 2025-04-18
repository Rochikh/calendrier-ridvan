import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Login form schema
const loginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, isLoggedIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: ""
    }
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const success = await login(data.password);
      
      if (success) {
        // Le toast est déjà dans la fonction login du AuthContext
        // La redirection se fait via le useEffect qui surveille isLoggedIn
        console.log("Login successful, redirecting...");
      } else {
        throw new Error("Échec de la connexion");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-80">
      <div className="absolute inset-0 -z-10 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-1.2.1&auto=format&fit=crop&w=2048&q=80)`,
          filter: 'blur(4px)'
        }} 
      />
      
      <Card className="max-w-md w-full mx-4 bg-white rounded-lg shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-[Cinzel] text-center text-[#1E3A8A] mb-6">
            Administrator Login
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-[Inter]">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter administrator password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-[Inter]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#1E3A8A] text-white font-[Inter] font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="mt-4 text-center">
                <a 
                  href="/" 
                  className="text-sm text-gray-600 hover:text-[#1E3A8A] transition-colors font-[Inter]"
                >
                  Return to Calendar
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
