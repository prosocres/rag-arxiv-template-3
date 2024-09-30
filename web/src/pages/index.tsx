import { z } from "zod"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { ChevronsUpDown, Plus, X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod";

const submitPaperFormSchema = z.object({
  paperUrl: z.string(),
  name: z.string(),
  pagesToDelete: z.string().optional(),
})

export default function Home() {
  const submitPaperForm = useForm<z.infer<typeof submitPaperFormSchema>>({
    resolver: zodResolver(submitPaperFormSchema),
  })

  function onPaperSubmit(values: z.infer<typeof submitPaperFormSchema>) {
    console.log("submit paper", values)
  }
  
  return (
    <div className="flex flex-row gap-5">
      {/** Add paper */}
      <div className="flex flex-col gap-2 border-[1px] border-gray-400 rounded-md p-2">
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
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <p className="font-normal">Delete pages?</p>
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <FormField
                control={submitPaperForm.control}
                name="pagesToDelete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pages to delete</FormLabel>
                    <FormControl>
                      <Input placeholder="10, 11, 12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pagse to delete from the paper.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
                />
              </CollapsibleContent>
            </Collapsible>
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
      {/** QA on paper */}
      <div></div>
    </div>
  );
}
