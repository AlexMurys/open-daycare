export default function InviteCard({
  childName,
  roomName,
}: {
  childName: string;
  roomName: string;
}) {
  return (
    <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-auth-line bg-white px-4 py-[14px]">
      <span className="flex size-[44px] flex-none items-center justify-center rounded-full bg-activity-avatar font-display text-[19px] font-semibold text-activity-deep">
        {childName.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] text-ink-faint">
          Te invitaron a seguir a
        </span>
        <span className="block font-display text-[17px] font-semibold text-ink">
          {childName} · {roomName}
        </span>
      </span>
    </div>
  );
}
