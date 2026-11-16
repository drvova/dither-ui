import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import ChatThreadExample from "./examples/chat-thread"
import chatThreadCode from "./examples/chat-thread.tsx?raw"
import ChatAssistantExample from "./examples/chat-assistant"
import chatAssistantCode from "./examples/chat-assistant.tsx?raw"
import ChatSupportExample from "./examples/chat-support"
import chatSupportCode from "./examples/chat-support.tsx?raw"
import ChatChannelExample from "./examples/chat-channel"
import chatChannelCode from "./examples/chat-channel.tsx?raw"

/* AI assistant — streamed replies, suggestion chips, stop control */
/* Support chat — quick replies, agent typing, ticket escalation */
/* Team channel — flat rows, author grouping, toggleable reactions */
/** A fresh copy of a list the demo mutates, its sample left as the example prints it. */

export default function ChatExamples() {
  return (
    <>
      <DocSection id="chat-thread">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Conversation list beside a live thread: unread badges clear when you open them, sending appends your bubble,
          and the other side types back. The typing dots hold still under reduced motion.
        </p>
        <DemoCard code={chatThreadCode}>
          <ChatThreadExample />
        </DemoCard>
      </DocSection>
      {/* AI assistant */}
      <DocSection id="chat-assistant">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An assistant thread: suggestion chips ask for you, replies stream in character by character, and Stop cancels
          mid-sentence. Under reduced motion the answer lands whole.
        </p>
        <DemoCard code={chatAssistantCode}>
          <ChatAssistantExample />
        </DemoCard>
      </DocSection>
      {/* Support chat */}
      <DocSection id="chat-support">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A support widget: online status in the header and quick-reply chips that really answer. “Talk to a human”
          escalates: the agent replies, then a system line opens the ticket.
        </p>
        <DemoCard code={chatSupportCode}>
          <ChatSupportExample />
        </DemoCard>
      </DocSection>
      {/* Team channel */}
      <DocSection id="chat-channel">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A channel, not bubbles: flat rows where consecutive messages from one author group under a single name, and
          reactions toggle with a click. Post something and watch your rows group too.
        </p>
        <DemoCard code={chatChannelCode}>
          <ChatChannelExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
