import a from "@/components/layout/AppShell.module.css";
import sk from "@/components/skeletons/Skeletons.module.css";
import RemindersListSkeleton from "@/components/skeletons/RemindersListSkeleton";
import ScheduleListSkeleton from "@/components/skeletons/ScheduleListSkeleton";
import SkeletonLine from "@/components/skeletons/SkeletonLine";

export default async function DashboardLoading() {
  return (
    <div className={a.mainContainer}>
      <div className={a.mainHeader}>
        <SkeletonLine className={`${sk.textLineShortLg}`} />
        {/* {currentDay} - {formatEuropeanDate(selectedISO)} */}
        <SkeletonLine className={sk.remindersSkeletonViewAll} />
        {/* {todayISO === selectedISO ? (
          <Link
            className={`${u.primaryButton} ${a.mainDateButton}`}
            href={localizePath(locale, `/?date=${tomorrowISO}`)}
          >
            {messages.home.tomorrow}
          </Link>
        ) : (
          <Link
            className={`${u.primaryButton} ${a.mainDateButton}`}
            href={localizePath(locale, `/`)}
          >
            {messages.home.today}
          </Link>
        )} */}
      </div>
      {/* <Suspense
        key={`reminders-${selectedISO}`}
        fallback={ */}
      <RemindersListSkeleton />
      {/* }
      >
        <RemindersContainer
          uid={session.uid}
          locale={locale}
          messages={messages}
          selectedISO={selectedISO}
        />
      </Suspense> */}
      {/* 
      <Suspense
        key={`schedule-${selectedISO}`}
        fallback={ */}
      <ScheduleListSkeleton />

      {/* }
      >
        <DashboardScheduleList
          schedulePromise={getDashboardData(session.uid, selectedISO)}
          lunchPromise={getLunchPerDay()}
          messages={messages}
          selectedDateISO={selectedISO}
          isToday={isToday}
        />
      </Suspense> */}
    </div>
  );
}
