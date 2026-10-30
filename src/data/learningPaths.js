
const CANVA_LEARN = "https://www.canva.com/designschool/";
const CANVA_FLYERS = "https://www.canva.com/create/flyers/";

export const learningPaths = [
  {
    id: "canva-design-project",
    title: "Graphic Design: Creating a Promotional Flyer",
    category: "Creative and Digital Skills",
    summary:
      "Learn practical graphic design skills and create a promotional flyer using Canva.",
    description:
      "Develop typography, colour, layout and visual communication skills through practical design activities.",
    outcome:
      "A completed promotional flyer that can be reviewed and added to a learner's portfolio.",
    skills: [
      "Typography and font pairing",
      "Colour and contrast",
      "Layout and visual composition",
      "Creating and presenting a professional flyer",
    ],
    format: "Guided, practical learning",
    duration: "Four weeks, adjusted to the learner's needs and pace",
    status: "pilot",
    accessType: "application",
    weeks: [
      {
        id: "week-1",
        title: "Week 1: Typography",
        objective: "Learn how to use text effectively in graphic design.",
        tasks: [
          {
            id: "w1-t1",
            title: "Understanding typography",
            description:
              "Learn how font styles, sizes and weights affect the appearance of a design.",
            lesson:
              "Typography is the arrangement of text to make a design attractive and easy to understand. Notice how large headlines attract attention while smaller text provides supporting information.",
            reference: {
              heading: "Visual hierarchy",
              headline: "MAKE YOUR MESSAGE STAND OUT",
              subtitle: "A clear and readable headline",
              body: "Supporting information should be easy to read.",
              label: "TYPOGRAPHY EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner can identify the headline, supporting text and body text in a design.",
          },
          {
            id: "w1-t2",
            title: "Exploring fonts and font pairing",
            description:
              "Explore different fonts and practise combining fonts that work well together.",
            lesson:
              "Choose fonts that complement each other. A bold font can work for a headline while a simpler font makes supporting information easier to read.",
            reference: {
              heading: "Font pairing",
              headline: "CREATIVE IDEAS",
              subtitle: "Bold headline with simple supporting text",
              body: "Use a small number of complementary fonts.",
              label: "FONT PAIRING EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner selected complementary fonts and used them consistently.",
          },
          {
            id: "w1-t3",
            title: "Creating a typography practice flyer",
            description:
              "Create a simple flyer using a clear headline, subtitle and supporting information.",
            lesson:
              "Practise the typography skills you have learned. Make the headline noticeable and ensure the other information is readable.",
            reference: {
              heading: "Your practice task",
              headline: "JOIN OUR EVENT",
              subtitle: "A day of learning and creativity",
              body: "Saturday | 10:00 AM | Lagos",
              label: "PRACTICE DESIGN",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The practice flyer contains a clear headline, subtitle and readable supporting text.",
          },
        ],
      },
      {
        id: "week-2",
        title: "Week 2: Colour and Contrast",
        objective: "Use colour combinations and contrast to improve communication.",
        tasks: [
          {
            id: "w2-t1",
            title: "Understanding colour combinations",
            description:
              "Explore how different colours work together in a design.",
            lesson:
              "Colours influence how a design looks and feels. Choose a small group of colours that support the message rather than distract from it.",
            reference: {
              heading: "Colour combinations",
              headline: "CHOOSE YOUR COLOURS",
              subtitle: "Build a consistent visual identity",
              body: "Use a limited palette that supports your message.",
              label: "COLOUR EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner selected a suitable and consistent colour palette.",
          },
          {
            id: "w2-t2",
            title: "Understanding contrast and readability",
            description:
              "Practise making text easy to read against its background.",
            lesson:
              "Contrast helps people distinguish text from its background. Avoid colour combinations that make important information difficult to read.",
            reference: {
              heading: "Contrast matters",
              headline: "READ THIS CLEARLY",
              subtitle: "Text should stand out from its background",
              body: "Check readability before completing your design.",
              label: "CONTRAST EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "Text and background have sufficient contrast for comfortable reading.",
          },
          {
            id: "w2-t3",
            title: "Creating a colour-based flyer",
            description:
              "Create a simple flyer using a consistent colour palette and readable text.",
            lesson:
              "Apply your colour knowledge to a practical design. Use colours consistently and keep important information easy to see.",
            reference: {
              heading: "Your colour task",
              headline: "DIGITAL SKILLS DAY",
              subtitle: "Learn something new",
              body: "Free workshop | Register today",
              label: "PRACTICE DESIGN",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The flyer uses a consistent colour palette and readable text.",
          },
        ],
      },
      {
        id: "week-3",
        title: "Week 3: Layout and Visual Composition",
        objective: "Arrange text and images into a clear, organised design.",
        tasks: [
          {
            id: "w3-t1",
            title: "Understanding layout and alignment",
            description:
              "Learn how to organise design elements and align them neatly.",
            lesson:
              "A good layout helps the audience understand information in the right order. Use alignment and spacing to organise your content.",
            reference: {
              heading: "Organise your layout",
              headline: "ONE CLEAR MESSAGE",
              subtitle: "Arrange information in a logical order",
              body: "Headline first. Details next. Action last.",
              label: "LAYOUT EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner arranged the design elements in a clear and organised layout.",
          },
          {
            id: "w3-t2",
            title: "Working with images and graphics",
            description:
              "Explore how images and visual elements support a design message.",
            lesson:
              "Images should help communicate the purpose of a flyer. Choose relevant visuals and avoid overcrowding the design.",
            reference: {
              heading: "Use relevant visuals",
              headline: "SHOW YOUR MESSAGE",
              subtitle: "Images should support your content",
              body: "Choose visuals that match your subject.",
              label: "IMAGE PLACEMENT EXAMPLE",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner selected relevant images or graphics and placed them appropriately.",
          },
          {
            id: "w3-t3",
            title: "Improving the flyer draft",
            description:
              "Review the draft and improve its spacing, alignment and readability.",
            lesson:
              "Review your design from the audience's perspective. Remove unnecessary elements and make sure the important information is easy to find.",
            reference: {
              heading: "Review your design",
              headline: "KEEP IT CLEAR",
              subtitle: "Simple, organised and readable",
              body: "Every element should serve a purpose.",
              label: "DESIGN REVIEW",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner improved the draft after checking its layout and readability.",
          },
        ],
      },
      {
        id: "week-4",
        title: "Week 4: Final Promotional Flyer",
        objective: "Combine the skills learned to produce a finished design.",
        tasks: [
          {
            id: "w4-t1",
            title: "Plan the final promotional flyer",
            description:
              "Choose a real or realistic event, product or service to promote.",
            lesson:
              "Think about the audience, the purpose of the flyer and the information people need. Plan your content before completing the design.",
            reference: {
              heading: "Final project brief",
              headline: "PROMOTE SOMETHING",
              subtitle: "An event, product or community activity",
              body: "Know your audience. Plan your message.",
              label: "FINAL PROJECT",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner selected a clear subject, audience and message for the final flyer.",
          },
          {
            id: "w4-t2",
            title: "Create and refine the final flyer",
            description:
              "Use typography, colour, layout and images to complete the design.",
            lesson:
              "Bring together the skills from the previous weeks. Check the accuracy of the information, visual consistency and readability.",
            reference: {
              heading: "Complete your design",
              headline: "MAKE IT PROFESSIONAL",
              subtitle: "Typography, colour and layout",
              body: "Review every detail before exporting.",
              label: "FINAL DESIGN",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The completed flyer demonstrates the design skills practised throughout the pathway.",
          },
          {
            id: "w4-t3",
            title: "Export and present the final flyer",
            description:
              "Download the finished design and submit it for supervisor review.",
            lesson:
              "Export your design in a suitable format, such as PNG or PDF. Share your Canva design link and explain the choices you made.",
            reference: {
              heading: "Present your work",
              headline: "YOUR DESIGN. YOUR WORK.",
              subtitle: "Prepare and share your final flyer",
              body: "Export, submit and discuss what you learned.",
              label: "PROJECT COMPLETION",
            },
            resourceUrl: CANVA_LEARN,
            canvaUrl: CANVA_FLYERS,
            reviewPrompt:
              "The learner submitted the finished flyer and explained what they learned.",
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
