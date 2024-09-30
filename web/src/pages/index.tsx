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

  function onPaperSubmit(_values: z.infer<typeof submitPaperFormSchema>) {
  }
  
  return (
    <div className="flex flex-row gap-5">
      {/** Add paper */}
      <div className="flex flex-col gap-2 border-[1px] border-gray-400 rounded-md">
        <Form {...submitPaperForm}>
        <form onSubmit={submitPaperForm.handleSubmit(onPaperSubmit)} className="space-y-8">
          <FormField
            control={submitPaperForm.control}
            name="paperUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paper URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://arxiv.org/pdf/2305.15334.pdf" {...field} />
                </FormControl>
                <FormDescription>
                  The URL to the PDF paper you want to submit.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={submitPaperForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Gorilla: Large Language Model Connected with Massive APIs" {...field} />
                </FormControl>
                <FormDescription>
                  The name of the paper you want to submit.
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
    </div>
  );
}
