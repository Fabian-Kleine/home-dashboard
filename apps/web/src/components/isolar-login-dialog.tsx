import { useEffect, useState, type FormEvent } from "react";
import { IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsolar } from "@/components/isolar-context";
import { useTranslation } from "@/lib/use-translation";

export function IsolarLoginDialog() {
  const {
    isLoginDialogOpen,
    closeLoginDialog,
    login,
    isLoggingIn,
    loginError,
    clearLoginError,
  } = useIsolar();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isLoginDialogOpen) {
      setEmail("");
      setPassword("");
    }
  }, [isLoginDialogOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <Dialog
      open={isLoginDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginDialog();
      }}
    >
      <DialogContent>
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden">
              <img src="/isolarcloud.png" alt="iSolarCloud logo" className="size-full object-contain" />
            </div>
            <DialogHeader className="gap-0">
              <DialogTitle>{t.sungrow.connect}</DialogTitle>
              <DialogDescription>
                {t.isolarLogin.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="isolar-email" className="text-xs font-bold text-slate-300">
                {t.isolarLogin.email}
              </label>
              <Input
                id="isolar-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearLoginError();
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="isolar-password" className="text-xs font-bold text-slate-300">
                {t.isolarLogin.password}
              </label>
              <Input
                id="isolar-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearLoginError();
                }}
              />
            </div>
            {loginError && (
              <div className="text-[13px] font-semibold text-red-400">{loginError}</div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoggingIn}>
              {isLoggingIn && <IconLoader2 className="size-3.5 animate-spin" />}
              {isLoggingIn ? t.isolarLogin.connecting : t.isolarLogin.connect}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
