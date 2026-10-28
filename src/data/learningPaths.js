
export const learningPaths = [
  {
    id: "canva-design-project",
    title: "Canva Design Project",
    category: "Creative and Digital Skills",
    summary:
      "Learn to use Canva to create a useful design for a real-world purpose.",
    description:
      "Explore visual design, practise accessible ways of working, and create a finished design such as a community-event flyer.",
    outcome:
      "A completed design project that can be reviewed and added to a learner's portfolio.",
    skills: [
      "Navigate Canva",
      "Explore design elements and layouts",
      "Create and edit a design",
      "Complete and present a project",
    ],
    format: "Guided, practical learning",
    duration: "Four weeks, adjusted to the learner's needs and pace",
    status: "pilot",
    accessType: "application",
    weeks: [
      {
        id: "week-1",
        title: "Week 1: Discover Canva",
        objective: "Get familiar with Canva and choose a poster goal.",
        tasks: [
          {
            id: "w1-t1",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The learner found the main tools in Canva using their preferred access method.",
            title: "Open Canva and explore the workspace",
            description:
              "Find the main tools using the learner's preferred access method.",
          },
          {
            id: "w1-t2",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The poster has a clear audience and message written in the learner's own words.",
            title: "Choose a community event or message",
            description:
              "Decide what the poster should communicate and who it is for.",
          },
          {
            id: "w1-t3",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The learner identified readable text and a clear message in the examples.",
            title: "Look at examples of clear posters",
            description:
              "Identify readable text, useful images, and a clear message.",
          },
        ],
      },
      {
        id: "week-2",
        title: "Week 2: Plan the poster",
        objective: "Organise the content and create a first draft.",
        tasks: [
          {
            id: "w2-t1",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The template suits the message and the learner's access needs.",
            title: "Choose a suitable poster template",
            description:
              "Select a template that fits the message and access needs.",
          },
          {
            id: "w2-t2",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The event name, date, time and venue are present and accurate.",
            title: "Add the key event information",
            description:
              "Include the event name, date, time, venue, and contact details where relevant.",
          },
          {
            id: "w2-t3",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The draft has all the planned content arranged on the page.",
            title: "Create the first poster draft",
            description:
              "Arrange the text and visual elements into a clear layout.",
          },
        ],
      },
      {
        id: "week-3",
        title: "Week 3: Design and improve",
        objective: "Refine the poster and check its readability.",
        tasks: [
          {
            id: "w3-t1",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The layout is easy to follow and free of unnecessary clutter.",
            title: "Improve the layout and spacing",
            description:
              "Make the message easy to follow and avoid unnecessary clutter.",
          },
          {
            id: "w3-t2",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "Contrast and text size are readable at the intended size.",
            title: "Check contrast and text readability",
            description:
              "Review colours, font sizes, and readability on the intended screen or print size.",
          },
          {
            id: "w3-t3",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The learner asked for feedback and understood what was suggested.",
            title: "Review the poster with a support person",
            description:
              "Ask for feedback using the learner's preferred communication method.",
          },
        ],
      },
      {
        id: "week-4",
        title: "Week 4: Finish and share",
        objective: "Complete the design and prepare it for review.",
        tasks: [
          {
            id: "w4-t1",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The final edits respond to the feedback that was given.",
            title: "Make final edits",
            description:
              "Use the feedback to improve the poster.",
          },
          {
            id: "w4-t2",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The poster was exported in a suitable format for its purpose.",
            title: "Export the finished poster",
            description:
              "Save the design in a suitable format with support if needed.",
          },
          {
            id: "w4-t3",
            canvaUrl: "https://www.canva.com/",
            reviewPrompt:
              "The learner presented the poster and described what they learned.",
            title: "Present the poster for review",
            description:
              "Share the completed design and discuss what was learned.",
          },
        ],
      },
    ],
  },
];

export const DEFAULT_PATHWAY_ID = learningPaths[0].id;

export function getPathwayById(pathwayId) {
  if (!pathwayId) return null;
  return learningPaths.find((pathway) => pathway.id === pathwayId) ?? null;
}

export function getPathwayOrFirst(pathwayId) {
  return getPathwayById(pathwayId) ?? learningPaths[0];
}

export function getPathwayTasks(pathway) {
  if (!pathway?.weeks) return [];
  return pathway.weeks.flatMap((week) => week.tasks);
}
