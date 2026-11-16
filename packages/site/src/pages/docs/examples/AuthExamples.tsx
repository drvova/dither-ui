import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import SignupExample from "./examples/signup"
import signupCode from "./examples/signup.tsx?raw"
import MagicLinkExample from "./examples/magic-link"
import magicLinkCode from "./examples/magic-link.tsx?raw"
import TwofactorExample from "./examples/twofactor"
import twofactorCode from "./examples/twofactor.tsx?raw"

export default function AuthExamples() {
  return (
    <>
      <DocSection id="signup">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A signup card with a working plan picker: a segmented control from plain aria-pressed buttons, over a purple
          wash.
        </p>
        <DemoCard code={signupCode}>
          <SignupExample />
        </DemoCard>
      </DocSection>
      <DocSection id="magic-link">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Passwordless in two states: send the link, then echo the address back with a pixel checkmark. Green wash,
          green button.
        </p>
        <DemoCard code={magicLinkCode}>
          <MagicLinkExample />
        </DemoCard>
      </DocSection>
      <DocSection id="twofactor">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Six code cells with auto-advancing focus: plain inputs, token borders, blue wash behind.
        </p>
        <DemoCard code={twofactorCode}>
          <TwofactorExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
