import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import TableMembersExample from "./examples/table-members"
import tableMembersCode from "./examples/table-members.tsx?raw"

export default function TableExamples() {
  return (
    <>
      <DocSection id="table-members">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole table contract in one block: filter, sortable columns with aria-sort, page-scoped select-all, a bulk
          remove that really removes, presence dots, and dithered pagination. Filter and sort compose; the range label
          tells the truth.
        </p>
        <DemoCard code={tableMembersCode}>
          <TableMembersExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
