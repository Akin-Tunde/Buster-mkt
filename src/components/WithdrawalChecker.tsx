"use client";

import { useAccount } from "wagmi";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminWithdrawalsSection } from "./AdminWithdrawalsSection";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Crown,
  Shield,
  ExternalLink,
} from "lucide-react";

export function WithdrawalChecker() {
  const { address, isConnected } = useAccount();
  const { isOwner, isAdmin, hasCreatorAccess } = useUserRoles();

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">
            Connect your wallet to check for available withdrawals
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            Your Admin Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {isOwner ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Contract Owner</p>
                <Badge variant={isOwner ? "default" : "outline"}>
                  {isOwner ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {isAdmin ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Admin Role</p>
                <Badge variant={isAdmin ? "default" : "outline"}>
                  {isAdmin ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {hasCreatorAccess ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Market Creator</p>
                <Badge variant={hasCreatorAccess ? "default" : "outline"}>
                  {hasCreatorAccess ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Withdrawal Access
                </h4>
                <p className="text-sm text-blue-800">
                  {isOwner || isAdmin
                    ? "✅ You have full withdrawal access to admin liquidity and platform fees"
                    : hasCreatorAccess
                    ? "⚠️ You can create markets but need admin role for withdrawals. You can still claim winnings from markets you participated in."
                    : "❌ You need creator, admin, or owner permissions to access admin withdrawals"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Section - Only show if has access */}
      {(isOwner || isAdmin) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              Available Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminWithdrawalsSection />
          </CardContent>
        </Card>
      )}

      {/* No Access - Provide Guidance */}
      {!(isOwner || isAdmin) && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-yellow-800">
              Limited Access
            </h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <p className="text-gray-700">
                You don't have admin permissions to access platform withdrawal
                features.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-semibold text-gray-900 mb-2">
                  What you can still do:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Claim winnings from markets you participated in</li>
                  <li>• View your portfolio and trade history</li>
                  <li>• Access free market claims if available</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-semibold text-blue-900 mb-2">
                  For admin withdrawals:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contact the contract owner to grant you admin role</li>
                  <li>
                    • If you created markets, you need creator + admin role to
                    withdraw initial liquidity
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => window.open("/profile", "_blank")}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Your Profile
                </Button>
                <Button
                  onClick={() => window.open("/free-markets", "_blank")}
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Free Market Claims
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
