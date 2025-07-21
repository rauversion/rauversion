import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { get, post, put } from "@rails/request.js";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

export default function ProductShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [form, setForm] = useState({
    shipping_status: "",
    tracking_code: "",
  });

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const response = await get(`/sales/${id}/product_show.json`);
        const data = await response.json;
        setProduct(data.product);
        setPurchase(data.product_item);
        setForm({
          shipping_status: data.product_item?.shipping_status || "",
          tracking_code: data.product_item?.tracking_code || "",
        });
      } catch (e) {
        toast({ title: "Error", description: "Failed to load purchase", variant: "destructive" });
      }
      setLoading(false);
    }
    fetchProduct();
    // eslint-disable-next-line
  }, [id, toast]);

  const handleFormChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await put(`/sales/${id}.json`, {
        body: {
          product_purchase: {
            shipping_status: form.shipping_status,
            tracking_code: form.tracking_code,
          },
        },
      });
      const data = await response.json;
      if (!data.errors) {
        toast({ title: "Purchase updated" });
        setPurchase((prev) => ({
          ...prev,
          shipping_status: form.shipping_status,
          tracking_code: form.tracking_code,
        }));
      } else {
        toast({ title: "Error", description: data.errors.join(", "), variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not update purchase", variant: "destructive" });
    }
    setUpdating(false);
  };

  const handleRefund = async () => {
    if (!window.confirm("Are you sure you want to refund this product?")) return;
    setRefunding(true);
    try {
      const response = await post(`/sales/${id}/refund.json?item_id=${purchase.id}`);
      const data = await response.json;
      if (!data.error) {
        toast({ title: "Refund processed" });
        setPurchase((prev) => ({
          ...prev,
          refunded: true,
        }));
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not process refund", variant: "destructive" });
    }
    setRefunding(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!product || !purchase) {
    return <div className="text-center text-muted-foreground py-10">Purchase not found.</div>;
  }

  return (
    <motion.div
      className="container mx-auto py-8 max-w-3xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold mb-6">Purchase Details</h1>
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-default">{product.title}</h3>
            <div className="flex items-center gap-3 mb-1">
              {purchase.user.avatar_url && purchase.user.avatar_url.small && (
                <Avatar>
                  <AvatarImage src={purchase.user.avatar_url.small} />
                  <AvatarFallback>
                    {purchase.user.full_name
                      ? purchase.user.full_name[0]
                      : purchase.user.username
                        ? purchase.user.username[0]
                        : "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <div className="font-semibold">
                  {purchase.user.full_name || purchase.user.name || purchase.user.username}
                </div>
                <div className="text-xs text-muted-foreground">{purchase.user.email}</div>
              </div>
            </div>
            <p className="text-sm text-muted">
              Purchased on {new Date(purchase.created_at).toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium text-muted">Quantity</div>
              <div className="text-default">{purchase.total_quantity}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">Price</div>
              <div className="text-default">${purchase.total_amount}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">Payment Status</div>
              <div className="text-default">{purchase.status}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted">Refunded</div>
              <div className="text-default">{purchase.refunded ? "Yes" : "No"}</div>
            </div>
          </div>
          {purchase.shipping_address && (
            <div className="mb-4">
              <div className="text-sm font-medium text-muted mb-1">Shipping Address</div>
              <div className="border rounded p-2 bg-muted">
                <div>Name: {purchase.shipping_name}</div>
                {Object.entries(purchase.shipping_address).map(([key, value]) =>
                  value ? (
                    <div key={key}>
                      {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: {value}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
          {/* Update form */}
          {purchase.can_refund && !purchase.refunded && (
            <form className="space-y-4 mt-6" onSubmit={handleUpdate}>
              <h2 className="text-2xl font-bold mb-2">Update Purchase</h2>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Shipping Status</label>
                <select
                  name="shipping_status"
                  value={form.shipping_status}
                  onChange={handleFormChange}
                  className="block w-full border rounded p-2"
                  required
                >
                  <option value="">Select status</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Tracking Code</label>
                <input
                  type="text"
                  name="tracking_code"
                  value={form.tracking_code}
                  onChange={handleFormChange}
                  className="block w-full border rounded p-2"
                  placeholder="Enter tracking code"
                />
              </div>
              <Button type="submit" disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Purchase
              </Button>
            </form>
          )}
          {/* Refund button */}
          {purchase.can_refund && !purchase.refunded && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-2">Refund</h2>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={refunding}
                  >
                    Refund Product
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Refund Product</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to refund this product? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={refunding}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRefund}
                      disabled={refunding}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {refunding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Yes, Refund
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
