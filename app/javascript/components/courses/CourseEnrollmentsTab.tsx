import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { get, post } from "@rails/request.js";

type Enrollment = {
  id: number;
  completed_lessons: any[];
  remaining_lessons: any[];
  module_progress: Record<string, { completed: number; total: number; percent: number }>;
};

type InvitationFormInputs = {
  email: string;
};

function getAverageProgress(module_progress: Enrollment["module_progress"]) {
  const percents = Object.values(module_progress || {}).map((m) => m.percent ?? 0);
  if (percents.length === 0) return 0;
  const avg = percents.reduce((a, b) => a + b, 0) / percents.length;
  return Math.round(avg * 100);
}

export default function CourseEnrollmentsTab() {
  const { register, handleSubmit, reset } = useForm<InvitationFormInputs>();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { id } = useParams<{ id: string }>();

  async function fetchEnrollments(courseId: string) {
    setLoading(true);
    try {
      const response = await get(`/courses/${courseId}/enrollments.json`);
      if (!response.ok) throw new Error("Failed to fetch enrollments");
      const data = await response.json;
      setEnrollments(data.collection);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!id) return;
    fetchEnrollments(id);
  }, [id]);

  const onInvite = async (data: InvitationFormInputs) => {
    if (!id) return;
    try {
      const response = await post(`/courses/${id}/invite.json`, {
          body: JSON.stringify({ email: data.email })});
  
      const result = await response.json;
      if (response.ok && result.success) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${data.email}`,
          variant: "default",
        });
        reset();
        fetchEnrollments(id);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Completed Lessons</TableHead>
                <TableHead>Remaining Lessons</TableHead>
                <TableHead>Progress (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No enrollments found.</TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.id}</TableCell>
                    <TableCell>{enrollment.completed_lessons?.length ?? 0}</TableCell>
                    <TableCell>{enrollment.remaining_lessons?.length ?? 0}</TableCell>
                    <TableCell>
                      {getAverageProgress(enrollment.module_progress)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 flex flex-col">
              <label htmlFor="invite-email" className="mb-1 text-sm font-medium">
                Email
              </label>
              <Input
                id="invite-email"
                placeholder="user@example.com"
                {...register("email", { required: true })}
                type="email"
                className="flex-1"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Send Invitation
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
