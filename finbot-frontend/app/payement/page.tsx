"use client"
import React, { useState } from 'react';
import { Shield, Lock, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

type PaymentStatus = 'success' | 'failed' | 'cancelled' | null;

const RazorpayPayment: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const amount = 50;
  const router = useRouter()
  const { error, isLoading, Razorpay } = useRazorpay();

  const handlePayment = (): void => {
    // setIsProcessing(true);
    
    // const options: RazorpayOrderOptions = {
    //   key: "YOUR_RAZORPAY_KEY",
    //   amount: amount * 100, // Amount in paise
    //   currency: "INR",
    //   name: "Test Company",
    //   description: "Test Transaction",
    //   order_id: "order_9A33XWu170gUtm", // Generate order_id on server
    //   handler: async (response: any): Promise<void> => {
    //     // This is where you get successful payment data
    //     console.log("Payment Success Response:", response);
        
    //     setPaymentData(response);
    //     setPaymentStatus('success');
    //     setIsProcessing(false);
        
    //     // Send to your server for verification
    //     try {
    //       const verifyResponse = await fetch('/api/verify-payment', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({
    //           razorpay_payment_id: response.razorpay_payment_id,
    //           razorpay_order_id: response.razorpay_order_id,
    //           razorpay_signature: response.razorpay_signature
    //         })
    //       });
          
    //       const verifyData = await verifyResponse.json();
    //       console.log("Verification Response:", verifyData);
    //     } catch (error) {
    //       console.error("Verification Error:", error);
    //     }
    //   },
    //   modal: {
    //     ondismiss: (): void => {
    //       setIsProcessing(false);
    //       setPaymentStatus('cancelled');
    //     }
    //   },
    //   prefill: {
    //     name: "John Doe",
    //     email: "john.doe@example.com",
    //     contact: "9999999999",
    //   },
    //   theme: {
    //     color: "#000000",
    //   },
    // };

    // const razorpayInstance = new Razorpay(options);
    
    // razorpayInstance.on('payment.failed', function (response: any): void {
    //   console.error("Payment Failed:", response.error);
    //   setPaymentStatus('failed');
    //   setIsProcessing(false);
    // });

    // razorpayInstance.open();
    toast.success('Payment Done!!')
    router.push('/dashboard')
  };

  // Reset to initial state
  const resetPayment = (): void => {
    setPaymentStatus(null);
    setPaymentData(null);
  };

  // Success Screen
  if (paymentStatus === 'success' && paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">Your payment has been processed successfully</p>
              
              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-gray-900">₹{amount}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-mono text-xs text-gray-900 break-all text-right ml-2">
                      {paymentData.razorpay_payment_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-xs text-gray-900 break-all text-right ml-2">
                      {paymentData.razorpay_order_id}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={resetPayment}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed Screen
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">Your payment could not be processed</p>
              
              <button
                onClick={resetPayment}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-700" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Complete Payment</h1>
            </div>
            <p className="text-sm text-gray-600">Secure checkout powered by Razorpay</p>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Amount to Pay</span>
                <span className="text-xs text-gray-500">INR</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">₹{amount}</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">Instant confirmation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">All major payment methods accepted</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">100% secure & encrypted</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">Error loading Razorpay: {error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing || isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Pay ₹{amount}
                </span>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                <Shield className="w-4 h-4" />
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-3">Accepted payment methods</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="bg-white border border-gray-200 rounded px-3 py-2">
              <span className="text-xs text-gray-700 font-medium">Cards</span>
            </div>
            <div className="bg-white border border-gray-200 rounded px-3 py-2">
              <span className="text-xs text-gray-700 font-medium">UPI</span>
            </div>
            <div className="bg-white border border-gray-200 rounded px-3 py-2">
              <span className="text-xs text-gray-700 font-medium">Net Banking</span>
            </div>
            <div className="bg-white border border-gray-200 rounded px-3 py-2">
              <span className="text-xs text-gray-700 font-medium">Wallets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;