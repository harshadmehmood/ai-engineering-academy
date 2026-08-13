/* ============================================================
   curriculum.js — the companion study path.

   Maps the AI Systems Academy's seven modules onto material in the
   cloned courses, so the library reads as a structured module rather
   than a file browser: finish an academy module, then work the
   external practice for it here.

   Paths are validated against the built index at load time; anything
   that has moved is reported rather than silently dropped, because
   these repos do restructure.
   ============================================================ */
window.STUDY_PATH = {
  name: 'Companion path',
  intro: 'Seven stages, one per academy module. The academy gives you the model and the trade-offs; ' +
         'these give you someone else\'s hands-on treatment of the same ground. Read the academy module first — ' +
         'the external material is practice, not introduction.',
  academyUrl: 'https://harshadmehmood.github.io/ai-engineering-academy/',

  stages: [{
    n: 1,
    academy: 'Foundations',
    academyHash: '#learn',
    goal: 'Confirm the mental model with someone else\'s framing, then get hands on the actual API surface.',
    items: [
      { p: 'agents-course/units/en/unit1/what-are-llms.mdx',
        why: 'A second framing of what the model does. Skim if the academy lesson landed.' },
      { p: 'agents-course/units/en/unit1/messages-and-special-tokens.mdx',
        why: 'Special tokens and chat templates — the mechanical layer under "messages".' },
      { p: 'anthropic-courses/anthropic_api_fundamentals/03_models.ipynb',
        why: 'Model selection in practice, against the routing lesson.' },
      { p: 'anthropic-courses/anthropic_api_fundamentals/04_parameters.ipynb',
        why: 'Temperature and stop sequences as real parameters rather than theory.' },
      { p: 'llm-zoomcamp/02-vector-search/lessons/02-embeddings.md',
        why: 'Embeddings with code attached.' }
    ]
  }, {
    n: 2,
    academy: 'Prompting as Engineering',
    academyHash: '#lesson/prompt-anatomy',
    goal: 'The most valuable external material in the whole library. Runnable, graded, and it disagrees with nothing in the academy.',
    items: [
      { p: 'anthropic-courses/prompt_engineering_interactive_tutorial/Anthropic 1P/01_Basic_Prompt_Structure.ipynb',
        why: 'Start here. The 1P variant, not the Bedrock copy.' },
      { p: 'anthropic-courses/prompt_engineering_interactive_tutorial/Anthropic 1P/04_Separating_Data_and_Instructions.ipynb',
        why: 'Directly the trust-boundary lesson, with exercises.' },
      { p: 'anthropic-courses/prompt_engineering_interactive_tutorial/Anthropic 1P/05_Formatting_Output_and_Speaking_for_Claude.ipynb',
        why: 'Prefill and output shaping — the structured-output lesson in practice.' },
      { p: 'anthropic-courses/prompt_engineering_interactive_tutorial/Anthropic 1P/07_Using_Examples_Few-Shot_Prompting.ipynb',
        why: 'Few-shot, hands on.' },
      { p: 'anthropic-courses/real_world_prompting/03_prompt_engineering.ipynb',
        why: 'Messy real inputs rather than clean examples.' }
    ]
  }, {
    n: 3,
    academy: 'Context Engineering',
    academyHash: '#context',
    goal: 'Thin externally — this is where the academy has the most to say and the courses the least. Two items, then go back.',
    sparse: true,
    items: [
      { p: 'llm-zoomcamp/03-orchestration/lessons/02-context-engineering.md',
        why: 'The only external lesson in the library that names context engineering directly.' },
      { p: 'agents-course/units/en/unit1/agent-steps-and-structure.mdx',
        why: 'How state accumulates across an agent loop — the growth curve you budget for.' }
    ]
  }, {
    n: 4,
    academy: 'Retrieval & Knowledge Systems',
    academyHash: '#lesson/rag-basics',
    goal: 'Strongest external coverage. Build the pipeline the academy describes.',
    items: [
      { p: 'llm-zoomcamp/01-agentic-rag/lessons/03-rag.md',
        why: 'The baseline pipeline end to end.' },
      { p: 'llm-zoomcamp/02-vector-search/lessons/04-vector-search.md',
        why: 'Vector retrieval with a real index.' },
      { p: 'llm-zoomcamp/06-best-practices/lessons/02-hybrid-search.md',
        why: 'Hybrid search — the fix for the identifier blind spot.' },
      { p: 'llm-zoomcamp/06-best-practices/lessons/03-reranking.md',
        why: 'Reranking, the highest-leverage precision step.' },
      { p: 'llm-zoomcamp/04-evaluation/lessons/04-search-evaluation.md',
        why: 'Measuring retrieval separately from generation.' },
      { p: 'agents-course/units/en/unit3/agentic-rag/agentic-rag.mdx',
        why: 'Letting the model drive retrieval.' }
    ]
  }, {
    n: 5,
    academy: 'Tools & Agents',
    academyHash: '#lesson/tool-design',
    goal: 'Tool schemas and loops, from two directions: the API surface and the framework abstractions.',
    items: [
      { p: 'anthropic-courses/tool_use/01_tool_use_overview.ipynb',
        why: 'The request/response cycle underneath every agent loop.' },
      { p: 'anthropic-courses/tool_use/03_structured_outputs.ipynb',
        why: 'Tool calling used purely to force a schema.' },
      { p: 'anthropic-courses/tool_use/05_tool_choice.ipynb',
        why: 'Forcing, disabling and steering tool selection.' },
      { p: 'agents-course/units/en/unit1/tools.mdx',
        why: 'Tool design from the framework side.' },
      { p: 'llm-zoomcamp/01-agentic-rag/lessons/14-agentic-loop.md',
        why: 'The loop written out explicitly.' },
      { p: 'agents-course/units/en/unit2/smolagents/multi_agent_systems.mdx',
        why: 'Multi-agent, against the academy\'s cost-multiplier argument.' },
      { p: 'llm-zoomcamp/03-orchestration/lessons/07-multi-agent.md',
        why: 'A second take, orchestration-flavoured.' }
    ]
  }, {
    n: 6,
    academy: 'Evaluation & Observability',
    academyHash: '#lesson/eval-why',
    goal: 'Do this one properly. If you finish only one stage, finish this one.',
    priority: true,
    items: [
      { p: 'anthropic-courses/prompt_evaluations/01_intro_to_evals/01_intro_to_evals.ipynb',
        why: 'Why evals exist, with a harness you can copy.' },
      { p: 'anthropic-courses/prompt_evaluations/03_code_graded_evals/03_code_graded.ipynb',
        why: 'Deterministic grading — free, fast, and the tier most teams skip.' },
      { p: 'anthropic-courses/prompt_evaluations/08_prompt_foo_model_graded/lesson.ipynb',
        why: 'Model-graded evals, the thing to calibrate before trusting.' },
      { p: 'llm-zoomcamp/04-evaluation/lessons/13-llm-as-judge.md',
        why: 'Judge design in a RAG context.' },
      { p: 'llm-zoomcamp/04-evaluation/code/04-llm-judge.ipynb',
        why: 'The runnable version of the lesson above.' },
      { p: 'agents-course/units/en/bonus-unit2/what-is-agent-observability-and-evaluation.mdx',
        why: 'Tracing and observability for agents specifically.' }
    ]
  }, {
    n: 7,
    academy: 'Production AI System Design',
    academyHash: '#lesson/sysdesign-method',
    goal: 'Operations: what you watch after it ships.',
    items: [
      { p: 'llm-zoomcamp/05-monitoring/lessons/04-metrics.md',
        why: 'Which metrics are worth collecting.' },
      { p: 'llm-zoomcamp/05-monitoring/lessons/08-user-feedback.md',
        why: 'Capturing the signal users actually give you.' },
      { p: 'llm-zoomcamp/05-monitoring/lessons/12-grafana.md',
        why: 'Putting it on a dashboard someone reads.' },
      { p: 'llm-zoomcamp/03-orchestration/lessons/08-best-practices.md',
        why: 'Operational habits, orchestration-side.' }
    ]
  }]
};
