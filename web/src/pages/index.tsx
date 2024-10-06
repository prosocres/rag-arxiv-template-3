import { z } from "zod"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { set, useForm } from "react-hook-form";
import { ChevronsUpDown } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ArxivPaperNote } from "./api/take_notes";

const submitPaperFormSchema = z.object({
  paperUrl: z.string(),
  name: z.string(),
  pagesToDelete: z.string().optional(),
})

function processPagesToDelete(pagesToDelete: string): Array<number> {
  const numArr = pagesToDelete.split(",").map((num) => parseInt(num.trim()));
  return numArr;
}

type SubmittedPaperData = {
  paperUrl: string;
  name: string;
  pagesToDelete?: Array<number>;
}

export default function Home() {
  const [submittedPaperData, setSubmittedPaperData] = useState <SubmittedPaperData | undefined>();
  const [notes, setNotes] = useState<Array<ArxivPaperNote> | undefined>();
  const submitPaperForm = useForm<z.infer<typeof submitPaperFormSchema>>({
    resolver: zodResolver(submitPaperFormSchema),
  })

  async function onPaperSubmit(values: z.infer<typeof submitPaperFormSchema>) {
    setSubmittedPaperData({
      ...values,
      pagesToDelete: values.pagesToDelete ? processPagesToDelete(values.pagesToDelete) : undefined,
    });
    const response = await fetch("/api/take_notes", {
      method: "POST",
      body: JSON.stringify(values),
    }).then((res) => {
      if (res.ok) {
        return res.json();
      }
      return null;
    });
    if (response) {
      console.log(`Response: ${response}`);
      setNotes(response);
      console.log(notes);
      if (notes && notes.length > 0) {
        console.log(notes[0]);
      }
    } else {
      throw new Error("Something went wrong taking notes.");
    }
  }
  
  return (
    <div className="flex flex-col gap-5">
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
      {notes && notes.length > 0 && (
        <div className="flex flex-col gap-2 max-w-[600px]">
          <h2>Notes</h2>
          <div className="flex flex-col gap-2">
            {notes.map((note, index) => (
              <div className="flex flex-col gap-2 p-2" key={index}>
                <p>{index + 1}. {note.note}</p>
                <p className = "text-sm text-gray-600">[{note.pageNumbers.join(", ")}]</p>
              </div>
            ))}
          </div>
        </div>
      )} 
    </div>
  );
}
