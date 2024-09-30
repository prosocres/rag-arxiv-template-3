import { z } from "zod"
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { pages } from "next/dist/build/templates/app-page";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const submitPaperFormSchema = z.object({
  paperUrl: z.string(),
  name: z.string(),
  pagesToDelete: z.array(z.number()).optional(),
})

export default function Home() {
  const submitPaperForm = useForm<z.infer<typeof submitPaperFormSchema>>({
    resolver: zodResolver(submitPaperFormSchema),
  })
  
  return (
    <div className="flex flex-row gap-5">
      {/** Add paper */}
      <div className="flex flex-col gap-2 border-[1px] border-gray-400 rounded-md"></div>
        <Form {...submitPaperForm}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={submitPaperForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {/** QA on paper */}
      <div></div>
    </div>
  );
}
