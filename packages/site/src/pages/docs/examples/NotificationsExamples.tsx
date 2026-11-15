import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import NotificationCenterExample from "./examples/notification-center"
import notificationCenterCode from "./examples/notification-center.tsx?raw"

export default function NotificationsExamples() {
  return (
    <>
      <DocSection id="notification-center">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A notification center: segmented All/Unread tabs, day groups, and an unread dot that clears on click or all at
          once. Empty the unread tab and it says so instead of showing nothing.
        </p>
        <DemoCard code={notificationCenterCode}>
          <NotificationCenterExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
