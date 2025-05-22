"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import React from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import useRefetch from "@/hooks/use-refetch";

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();

  const onSubmit = async (data: FormInput) => {
    try {
      await createProject.mutateAsync({
        githubUrl: data.repoUrl,
        name: data.projectName,
        githubToken: data.githubToken
      });
      
      toast.success('Project created successfully');
      refetch();
      reset();
    } catch (error) {
      toast.error('Failed to create project');
      console.error('Project creation error:', error);
    }
  };

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <Image alt="createImage" src={"/create.svg"} height={224} width={224} />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your Github Repository
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your repository to link it with GitIntel
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
            <Input
              {...register("projectName", { 
                required: "Project name is required",
                minLength: {
                  value: 3,
                  message: "Project name must be at least 3 characters"
                }
              })}
              placeholder="Project Name"
              aria-invalid={!!errors.projectName}
            />
            {errors.projectName && (
              <p className="text-sm text-destructive">{errors.projectName.message}</p>
            )}

            <Input
              {...register("repoUrl", { 
                required: "Repository URL is required",
                pattern: {
                  value: /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/,
                  message: "Please enter a valid GitHub repository URL"
                }
              })}
              placeholder="Github URL"
              type="url"
              aria-invalid={!!errors.repoUrl}
            />
            {errors.repoUrl && (
              <p className="text-sm text-destructive">{errors.repoUrl.message}</p>
            )}

            <Input
              {...register("githubToken")}
              placeholder="Personal Access Token (Optional)"
              type="password"
            />

            <Button 
              type="submit" 
              disabled={createProject.isPending}
              className="w-full"
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;