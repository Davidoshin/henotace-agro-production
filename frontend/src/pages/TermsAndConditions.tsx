import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, CreditCard, Users, AlertCircle, Building2, Wallet, BanknoteIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const lastUpdated = "December 2025";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Terms and Conditions</h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                By accessing and using the Henotace Business Platform ("Platform", "Service", "we", "us", or "our"), 
                you accept and agree to be bound by the terms and provision of this agreement. If you do not agree 
                to abide by the above, please do not use this service.
              </p>
              <p>
                These Terms and Conditions ("Terms") govern your access to and use of our business management platform, 
                including all features, content, and services provided through the Platform such as POS, inventory 
                management, staff management, payment processing, and AI-powered analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                2. User Accounts and Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Account Creation:</strong> You are responsible for maintaining the confidentiality of your 
                account credentials and for all activities that occur under your account.
              </p>
              <p>
                <strong>User Roles:</strong> The Platform supports multiple user roles including business owners, 
                staff members, and customers. Each role has specific permissions and responsibilities.
              </p>
              <p>
                <strong>Account Security:</strong> You must immediately notify us of any unauthorized use of your 
                account or any other breach of security.
              </p>
              <p>
                <strong>Business Information:</strong> You agree to provide accurate and complete business information 
                during registration and to keep this information updated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                3. Payment Terms and Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="space-y-3">
                <p>
                  <strong>Payment Processing:</strong> All payments on the Platform are processed through secure 
                  third-party payment gateways (Paystack and Flutterwave) or via direct bank transfer as configured 
                  by your business.
                </p>
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground mb-2">Platform Transaction Fees</p>
                      
                      <div className="space-y-4">
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="font-medium text-foreground mb-1">Payment Gateway Transactions (Paystack/Flutterwave)</p>
                          <p>
                            For payments processed via Paystack or Flutterwave, the payment gateway charges apply 
                            (typically 1.5% of transaction amount). Additionally, platform fees may apply based on 
                            your subscription plan.
                          </p>
                        </div>
                        
                        <div className="bg-background/50 rounded-lg p-3">
                          <p className="font-medium text-foreground mb-1">Bank Transfer Transactions</p>
                          <p>
                            A <strong>flat fee of ₦50 (Fifty Naira)</strong> is charged on every bank transfer 
                            payment processed through the Platform. This fee is:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Deducted from the business owner's wallet balance</li>
                            <li>Applied after the business owner approves the payment</li>
                            <li>Used to maintain platform services and infrastructure</li>
                          </ul>
                        </div>
                        
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                          <p className="font-medium text-foreground mb-1">⚠️ Bank Transfer Suspension Policy</p>
                          <p>
                            If a business owner's wallet balance is insufficient to cover platform fees:
                          </p>
                          <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                            <li>Fees will accumulate as pending charges</li>
                            <li>After 20 pending transactions (₦1,000), a warning notification and email will be sent</li>
                            <li>After the 21st pending transaction, bank transfer payments will be temporarily suspended</li>
                            <li>To restore bank transfer, fund your wallet (minimum ₦1,000)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p>
                  <strong>Payment Authorization:</strong> By initiating a payment, you authorize us and the payment 
                  gateway to charge the total amount (including any applicable fees) to your selected payment method.
                </p>
                
                <p>
                  <strong>Refunds:</strong> Refund policies are determined by the business. Platform 
                  fees are non-refundable except in cases of technical errors or duplicate transactions caused by 
                  system failures.
                </p>
                
                <p>
                  <strong>Payment Methods:</strong> The Platform supports various payment methods including debit cards, 
                  credit cards, bank transfers, and mobile money, as enabled by the business.
                </p>
                
                <p>
                  <strong>Currency:</strong> All transactions are processed in Nigerian Naira (NGN).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                4. Business Wallet Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Wallet Functionality:</strong> Business owners have a digital wallet that is used for 
                platform fee deductions and other platform-related charges.
              </p>
              <p>
                <strong>Wallet Funding:</strong> Business owners can fund their wallet via Flutterwave. 
                The minimum funding amount is <strong>₦1,000 (One Thousand Naira)</strong>.
              </p>
              <p>
                <strong>Automatic Deductions:</strong> Platform fees for bank transfer transactions are 
                automatically deducted from the business wallet when payments are approved.
              </p>
              <p>
                <strong>Pending Fees:</strong> If your wallet balance is insufficient, fees accumulate as 
                pending charges. These are automatically cleared when you fund your wallet.
              </p>
              <p>
                <strong>Wallet Security:</strong> Wallet balances are maintained securely and are linked to your 
                business account. You are responsible for maintaining the security of your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                5. Business Services and Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>POS System:</strong> The Platform provides a comprehensive Point of Sale system for 
                processing sales, managing inventory, and tracking transactions. You are responsible for 
                accurate product pricing and inventory management.
              </p>
              <p>
                <strong>Inventory Management:</strong> Stock levels, product information, and pricing are managed 
                by you. The Platform provides tools to help track and manage inventory but does not guarantee 
                against discrepancies due to user error.
              </p>
              <p>
                <strong>AI Services:</strong> The Platform provides AI-powered features including business analytics, 
                insights, and recommendations. These services are provided "as-is" and should be used as supplementary 
                decision-making tools. We do not guarantee the accuracy of AI predictions or recommendations.
              </p>
              <p>
                <strong>Staff Management:</strong> The Platform allows you to manage staff accounts, track clock-in/out, 
                process payroll, and manage performance. You are responsible for compliance with labor laws and 
                regulations in your jurisdiction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Data Collection:</strong> We collect and process personal and business information necessary 
                to provide our services. This includes account information, payment data, business records, customer 
                data, and usage analytics.
              </p>
              <p>
                <strong>Data Security:</strong> We implement industry-standard security measures to protect your 
                business and personal information. However, no method of transmission over the internet is 100% secure.
              </p>
              <p>
                <strong>Data Sharing:</strong> We may share your information with payment gateway providers (Paystack, 
                Flutterwave) as necessary to process transactions. We do not sell your business or customer 
                information to third parties.
              </p>
              <p>
                <strong>Customer Data:</strong> You are responsible for how you collect and use customer data through 
                the Platform. Ensure compliance with applicable data protection regulations.
              </p>
              <p>
                For detailed information about our data practices, please review our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the Platform for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Platform</li>
                <li>Interfere with or disrupt the Platform's servers or networks</li>
                <li>Use automated systems (bots, scrapers) to access the Platform without permission</li>
                <li>Share your account credentials with others</li>
                <li>Impersonate any person or entity</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Platform Ownership:</strong> The Platform, including its design, features, and content, 
                is owned by Henotace and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                <strong>User Content:</strong> You retain ownership of content you create or upload. By using the 
                Platform, you grant us a license to use, display, and distribute your content as necessary to 
                provide our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Service Availability:</strong> We strive to maintain Platform availability but do not 
                guarantee uninterrupted or error-free service. The Platform may be temporarily unavailable due to 
                maintenance, updates, or unforeseen circumstances.
              </p>
              <p>
                <strong>No Warranties:</strong> The Platform is provided "as-is" and "as-available" without 
                warranties of any kind, either express or implied.
              </p>
              <p>
                <strong>Limitation:</strong> To the maximum extent permitted by law, Henotace shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages arising from your use of 
                the Platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Termination by You:</strong> You may terminate your account at any time by contacting 
                our support team. Any outstanding platform fees must be settled before account closure.
              </p>
              <p>
                <strong>Termination by Us:</strong> We reserve the right to suspend or terminate your account if 
                you violate these Terms, engage in fraudulent activity, fail to pay outstanding fees, or for any 
                other reason we deem necessary.
              </p>
              <p>
                <strong>Effect of Termination:</strong> Upon termination, your right to use the Platform will 
                immediately cease. You will have 30 days to export your business data. Outstanding fees and 
                obligations remain your responsibility.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be communicated 
                through the Platform or via email. Your continued use of the Platform after changes are posted 
                constitutes acceptance of the modified Terms.
              </p>
              <p>
                The "Last updated" date at the top of this page indicates when these Terms were last revised.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Governing Law and Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                <strong>Governing Law:</strong> These Terms are governed by the laws of the Federal Republic of 
                Nigeria.
              </p>
              <p>
                <strong>Dispute Resolution:</strong> Any disputes arising from these Terms or your use of the 
                Platform shall first be addressed through good faith negotiation. If resolution cannot be reached, 
                disputes shall be resolved through binding arbitration in accordance with Nigerian arbitration laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                If you have questions about these Terms and Conditions, please contact us:
              </p>
              <ul className="space-y-2 ml-4">
                <li>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:hello@henotaceai.ng" className="text-primary hover:underline">
                    hello@henotaceai.ng
                  </a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <a href="https://henotaceai.ng" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    https://henotaceai.ng
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

