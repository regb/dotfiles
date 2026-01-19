---
description: Transform a large amount of unstructured text into an easy-to-navigate set of markdown files
---

# Purpose

Understand the content of `TEXT_FILE` and turn it into a well-organized set of small markdown files in the `OUT_DIR` folder that can be quickly navigated without having to read all of them. Execute the `Workflow` and `Report` sections.

## Variables

TEXT_FILE: $1
OUT_DIR: $2

## Instructions

- The goal is to make a very easy and self-describing primer which can be navigated quickly without needed to read everything, as a set of markdown files
- Use a lot of references between the markdown files, so that when a user reads one markdown, it's very clear where to go for more details in each section
- Favor splitting into many small chapters than few large ones. The more small and self-contained files, the better.
- Overall goal for the output is that it should be possible to start from the outline and the overview, and then directly jump to a relevant chapter which is self-contained.
- Feel free to duplicate some information across chapters, it's better if each chapter is small but mostly self-contained, instead of needing to read 5 chapters to understand one concepts. Duplicating information is ok as long as the chapter remains small, but as long as a chapter gets too large, you should instead use references and not duplicate.

## Workflow

1. Start by reading the file `TEXT_FILE` and deeply understand the content. Think hard.
2. Plan a high-level outline for organizing the content. Write that outline to a file `OUT_DIR/outline.md`.
    - The outline should only contain the title for each chapter and up to one level of sections within the chapter.
    - Only add sections if the content of each chapter is large, otherwise one layer of chapters is sufficient.
    - Make sure that the info is organize in a way where someone could just look at the outline and then jump straight to the relevant chapter.
    - The first chapter in the outline should be `Overview`
3. Sketch out every chapter with its own markdown file, within `OUT_DIR`.
    - You should start with the title, a first high-level paragraph for that chapter, and then for each section and potentially subsections in the chatper, add the corresponding header and also a one paragraph high-level summary of what should go there.
    - This is only a first pass, later you will refine each of the sections. This helps keep the structure consistent.
4. Once you have a rough structure with high level content and structure for each chapter, you should now execute <refine_chapter> for every single chapter (except the outline). Make sure to use a todo list to track progress for each chapter.

<refine_chapter>
- Read the current content of the chapter, this is a very high-level summary with some structure.
- Draw on your knowledge from the initial content of `TEXT_FILE` as well as your own knowledge, and expand the details of the chapter to include all the information that were in the `TEXT_FILE` and that are appropriate for this chapter.
- If you realize there are gaps, leave `TODO` markers in the text saying that more research is needed. DO NOT research additional data for now, stay focused.
</refine_chapter>

## Report

Write out a very concise summary of the structure of the primer that you created, mostly the content of the outline.
Say where the primer can be found, and if you left any `TODO` give a short summary of potential next steps and what remains open.
