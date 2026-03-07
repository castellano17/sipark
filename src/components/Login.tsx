import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LogIn, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await (window.api as any).authenticateUser(
        username,
        password,
      );

      if (result.success && result.user) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        onLogin(result.user);
      } else {
        setError(result.message || "Usuario o contraseña incorrectos");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <Card className="w-full max-w-md p-8 bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SIPARK</h1>
          <p className="text-slate-400">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Usuario</label>
            <Input
              type="text"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">
              Contraseña
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
