import { Brain, Code, Gauge, GitBranch, Laptop2, Zap } from 'lucide-react'

const features = [
  {
    name: 'Multiple Programming Languages',
    description: 'Practice in your preferred language. We support Python, JavaScript, and many more.',
    icon: Code,
  },
  {
    name: 'Real-time Code Execution',
    description: 'Get instant feedback on your code with our real-time execution environment.',
    icon: Zap,
  },
  {
    name: 'Performance Metrics',
    description: 'Track your code performance with detailed metrics and execution time.',
    icon: Gauge,
  },
  {
    name: 'Version Control',
    description: 'Keep track of your solution history and improvements over time.',
    icon: GitBranch,
  },
  {
    name: 'Interactive Learning',
    description: 'Learn from detailed explanations and step-by-step guides.',
    icon: Brain,
  },
  {
    name: 'Modern IDE Features',
    description: 'Enjoy syntax highlighting, auto-completion, and more in our code editor.',
    icon: Laptop2,
  },
]

export function FeaturesSection() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to excel
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Our platform provides all the tools and features you need to improve your coding skills and prepare for technical interviews.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <feature.icon className="h-5 w-5 flex-none" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

