import { beforeEach, expect, test, vi } from "vitest";
import { getFunctionName } from "convex/server";
const mocks = vi.hoisted(() => ({
  token: vi.fn(),
  session: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
  setCookie: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: mocks.token,
}));
vi.mock("@/lib/session", () => ({ requireSession: mocks.session }));
vi.mock("convex/nextjs", () => ({
  fetchQuery: mocks.query,
  fetchMutation: mocks.mutation,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: mocks.setCookie }),
}));
import * as actions from "../app/(app)/actions";
import { getUserSettings, getSubjectCatalog } from "../lib/schedule/store";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.token.mockResolvedValue("auth-token");
  mocks.session.mockResolvedValue({ uid: "user-a" });
});
test("deadline server action forwards date, full text, and the session token to Convex", async () => {
  const form = new FormData();
  form.set("text", " Task ");
  form.set("description", " Details ");
  form.set("date", "2099-01-01");
  await actions.addDeadlineAction(form);
  const [ref, args, options] = mocks.mutation.mock.calls[0];
  expect(getFunctionName(ref)).toBe("deadlines:addDeadline");
  expect(args).toEqual({
    text: "Task",
    description: "Details",
    date: "2099-01-01",
  });
  expect(options).toEqual({ token: "auth-token" });
});
test("deadline actions propagate undo receipts and send only the receipt ID when restoring", async () => {
  const receipt = {
    receiptId: "opaque-receipt",
    uid: "user-a",
    kind: "remove" as const,
    index: 0,
    deadline: {
      id: "task",
      text: "Task",
      description: "",
      date: "2099-01-01",
      status: "upcoming" as const,
    },
  };
  mocks.mutation.mockResolvedValue(receipt);
  const form = new FormData();
  form.set("id", "task");
  expect(await actions.removeDeadlineAction(form)).toEqual(receipt);
  expect(await actions.markAsDoneDeadlineAction(form)).toEqual(receipt);
  await actions.undoDeadlineAction(receipt);
  expect(mocks.mutation.mock.calls.at(-1)?.slice(1)).toEqual([
    { receiptId: "opaque-receipt" },
    { token: "auth-token" },
  ]);
  await expect(
    actions.undoDeadlineAction({ ...receipt, uid: "someone-else" }),
  ).rejects.toThrow("Invalid");
});
test("settings action carries new planning sort and returns a complete UI settings object", async () => {
  mocks.mutation.mockResolvedValue({
    theme: "dark",
    locale: "pl",
    useSchoolYear: true,
    planningSubjectSort: "name-desc",
    _id: "private-db-field",
  });
  expect(
    await actions.updateSettingsAction({ planningSubjectSort: "name-desc" }),
  ).toEqual({
    theme: "dark",
    locale: "pl",
    useSchoolYear: true,
    planningSubjectSort: "name-desc",
  });
  expect(mocks.mutation.mock.calls[0][1]).toEqual({
    planningSubjectSort: "name-desc",
  });
});
test("settings without a saved row default to alphabetical planning sort", async () => {
  mocks.query.mockResolvedValue(null);
  expect((await getUserSettings()).planningSubjectSort).toBe("name-asc");
});

test("settings reads preserve planning sort and normalize older rows missing that field", async () => {
  for (const planningSubjectSort of [
    "count-desc",
    "count-asc",
    "name-asc",
    "name-desc",
  ]) {
    mocks.query.mockResolvedValue({
      theme: "dark",
      locale: "en",
      useSchoolYear: true,
      planningSubjectSort,
    });
    expect((await getUserSettings()).planningSubjectSort).toBe(
      planningSubjectSort,
    );
  }
  mocks.query.mockResolvedValue({
    theme: "light",
    locale: "cs",
    useSchoolYear: false,
  });
  expect((await getUserSettings()).planningSubjectSort).toBe("count-desc");
});
test("planning visibility travels through the authenticated action and state loader", async () => {
  await actions.setSubjectPlanningVisibilityAction({
    id: "trip",
    hiddenFromPlanning: true,
    writerId: "tab-a",
  });
  const [ref, args, options] = mocks.mutation.mock.calls[0];
  expect(getFunctionName(ref)).toBe("subjects:setPlanningVisibility");
  expect(args).toEqual({
    slug: "trip",
    hiddenFromPlanning: true,
    writerId: "tab-a",
  });
  expect(options).toEqual({ token: "auth-token" });
  mocks.query.mockImplementation(async (ref) => {
    if (getFunctionName(ref) === "subjects:getSubjects")
      return [
        {
          slug: "trip",
          name: "School trip",
          color: "#123456",
          hiddenFromPlanning: true,
        },
        { slug: "math", name: "Math", color: "#654321" },
      ];
    return [];
  });
  expect((await getSubjectCatalog()).subjects).toEqual([
    {
      id: "trip",
      name: "School trip",
      color: "#123456",
      hiddenFromPlanning: true,
    },
    { id: "math", name: "Math", color: "#654321", hiddenFromPlanning: false },
  ]);
  mocks.token.mockResolvedValue(undefined);
  await expect(
    actions.setSubjectPlanningVisibilityAction({
      id: "trip",
      hiddenFromPlanning: false,
    }),
  ).rejects.toThrow("Unauthorized");
});

test("server data reads and mutations reject missing tokens instead of returning fake defaults", async () => {
  mocks.token.mockResolvedValue(undefined);
  await expect(getSubjectCatalog()).rejects.toThrow("Unauthorized");
  await expect(getUserSettings()).rejects.toThrow("Unauthorized");
  await expect(
    actions.setSlotSubjectAction({
      weekStart: "2026-09-14",
      dayIndex: 0,
      slotIndex: 1,
      subjectId: "math",
    }),
  ).rejects.toThrow("Unauthorized");
  expect(mocks.query).not.toHaveBeenCalled();
  expect(mocks.mutation).not.toHaveBeenCalled();
});
