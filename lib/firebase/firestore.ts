import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type {
  Draft,
  Feedback,
  FeedbackTag,
  Invite,
  UserProfile,
} from "@/lib/types";

export const FEEDBACK_TAG_OPTIONS: Array<{
  value: FeedbackTag;
  label: string;
}> = [
  { value: "clear", label: "Clear" },
  { value: "interesting", label: "Interesting" },
  { value: "confusing", label: "Confusing" },
  { value: "needs_detail", label: "Needs detail" },
];

function assertTimestamp(value: unknown) {
  return value instanceof Timestamp ? value : Timestamp.now();
}

export async function signUpUser(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, "users", credential.user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function signInUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, "users", credential.user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      name: credential.user.displayName ?? email.split("@")[0],
      email,
      createdAt: serverTimestamp(),
    });
  }

  return credential.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: data.name,
    email: data.email,
    createdAt: assertTimestamp(data.createdAt),
  };
}

export async function createDraft(input: {
  authorId: string;
  title: string;
  content: string;
}) {
  const trimmedTitle = input.title.trim();
  const trimmedContent = input.content.trim();

  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content are required.");
  }

  const documentRef = await addDoc(collection(db, "drafts"), {
    authorId: input.authorId,
    title: trimmedTitle,
    content: trimmedContent,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    feedbackCount: 0,
    viewCount: 0,
  });

  return documentRef.id;
}

export async function getDraftsByAuthor(authorId: string): Promise<Draft[]> {
  const draftQuery = query(
    collection(db, "drafts"),
    where("authorId", "==", authorId),
    orderBy("updatedAt", "desc"),
  );

  const snapshot = await getDocs(draftQuery);

  return snapshot.docs.map((draftDocument) => {
    const data = draftDocument.data();

    return {
      id: draftDocument.id,
      authorId: data.authorId,
      title: data.title,
      content: data.content,
      createdAt: assertTimestamp(data.createdAt),
      updatedAt: assertTimestamp(data.updatedAt),
      feedbackCount: data.feedbackCount ?? 0,
      viewCount: data.viewCount ?? 0,
    };
  });
}

export async function getDraftById(draftId: string): Promise<Draft | null> {
  const snapshot = await getDoc(doc(db, "drafts", draftId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    authorId: data.authorId,
    title: data.title,
    content: data.content,
    createdAt: assertTimestamp(data.createdAt),
    updatedAt: assertTimestamp(data.updatedAt),
    feedbackCount: data.feedbackCount ?? 0,
    viewCount: data.viewCount ?? 0,
  };
}

export async function getPublicDraftById(draftId: string) {
  return getDraftById(draftId);
}

export async function createInvite(input: {
  draftId: string;
  creatorId: string;
  maxUses: number;
  expiresAtIso: string;
}) {
  if (input.maxUses < 1) {
    throw new Error("maxUses must be at least 1.");
  }

  const expiresAt = new Date(input.expiresAtIso);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error("A valid expiration date is required.");
  }

  const documentRef = await addDoc(collection(db, "invites"), {
    draftId: input.draftId,
    creatorId: input.creatorId,
    maxUses: input.maxUses,
    usedCount: 0,
    expiresAt: Timestamp.fromDate(expiresAt),
    isActive: true,
    createdAt: serverTimestamp(),
  });

  return documentRef.id;
}

export async function getInvitesByDraftId(draftId: string): Promise<Invite[]> {
  const inviteQuery = query(
    collection(db, "invites"),
    where("draftId", "==", draftId),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(inviteQuery);

  return snapshot.docs.map((inviteDocument) => {
    const data = inviteDocument.data();

    return {
      id: inviteDocument.id,
      draftId: data.draftId,
      creatorId: data.creatorId,
      maxUses: data.maxUses ?? 0,
      usedCount: data.usedCount ?? 0,
      expiresAt: assertTimestamp(data.expiresAt),
      isActive: Boolean(data.isActive),
      createdAt: assertTimestamp(data.createdAt),
    };
  });
}

export async function getInviteById(inviteId: string): Promise<Invite | null> {
  const snapshot = await getDoc(doc(db, "invites", inviteId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    draftId: data.draftId,
    creatorId: data.creatorId,
    maxUses: data.maxUses ?? 0,
    usedCount: data.usedCount ?? 0,
    expiresAt: assertTimestamp(data.expiresAt),
    isActive: Boolean(data.isActive),
    createdAt: assertTimestamp(data.createdAt),
  };
}

export async function consumeInviteAccess(inviteId: string): Promise<{
  invite: Invite;
  draft: Draft;
}> {
  return runTransaction(db, async (transaction) => {
    const inviteRef = doc(db, "invites", inviteId);
    const inviteSnapshot = await transaction.get(inviteRef);

    if (!inviteSnapshot.exists()) {
      throw new Error("Invite not found.");
    }

    const inviteData = inviteSnapshot.data();
    const expiresAt = assertTimestamp(inviteData.expiresAt);
    const isActive = Boolean(inviteData.isActive);
    const maxUses = inviteData.maxUses ?? 0;
    const usedCount = inviteData.usedCount ?? 0;

    if (!isActive) {
      throw new Error("This invite is inactive.");
    }

    if (expiresAt.toMillis() < Date.now()) {
      throw new Error("This invite has expired.");
    }

    if (usedCount >= maxUses) {
      throw new Error("This invite has reached its usage limit.");
    }

    const draftRef = doc(db, "drafts", inviteData.draftId);
    const draftSnapshot = await transaction.get(draftRef);

    if (!draftSnapshot.exists()) {
      throw new Error("Draft not found.");
    }

    transaction.update(inviteRef, {
      usedCount: increment(1),
    });

    transaction.update(draftRef, {
      viewCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    const draftData = draftSnapshot.data();

    return {
      invite: {
        id: inviteSnapshot.id,
        draftId: inviteData.draftId,
        creatorId: inviteData.creatorId,
        maxUses,
        usedCount: usedCount + 1,
        expiresAt,
        isActive,
        createdAt: assertTimestamp(inviteData.createdAt),
      },
      draft: {
        id: draftSnapshot.id,
        authorId: draftData.authorId,
        title: draftData.title,
        content: draftData.content,
        createdAt: assertTimestamp(draftData.createdAt),
        updatedAt: assertTimestamp(draftData.updatedAt),
        feedbackCount: draftData.feedbackCount ?? 0,
        viewCount: (draftData.viewCount ?? 0) + 1,
      },
    };
  });
}

export async function submitFeedback(input: {
  draftId: string;
  inviteId: string;
  reviewerId: string;
  nickname: string;
  tags: FeedbackTag[];
  comment: string;
}) {
  const normalizedNickname = input.nickname.trim() || "Anonymous reader";
  const normalizedComment = input.comment.trim();
  const uniqueTags = [...new Set(input.tags)];

  if (!normalizedComment) {
    throw new Error("A comment is required.");
  }

  const feedbackId = `${input.inviteId}_${input.reviewerId}`;
  const feedbackRef = doc(db, "feedbacks", feedbackId);
  const draftRef = doc(db, "drafts", input.draftId);

  await runTransaction(db, async (transaction) => {
    const [draftSnapshot, feedbackSnapshot] = await Promise.all([
      transaction.get(draftRef),
      transaction.get(feedbackRef),
    ]);

    if (!draftSnapshot.exists()) {
      throw new Error("Draft not found for feedback.");
    }

    if (feedbackSnapshot.exists()) {
      throw new Error("Feedback was already submitted from this invite session.");
    }

    transaction.set(feedbackRef, {
      draftId: input.draftId,
      inviteId: input.inviteId,
      reviewerId: input.reviewerId,
      nickname: normalizedNickname,
      tags: uniqueTags,
      comment: normalizedComment,
      createdAt: serverTimestamp(),
    });

    transaction.update(draftRef, {
      feedbackCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  });

  return feedbackId;
}

export async function getFeedbacksByDraftId(draftId: string): Promise<Feedback[]> {
  const feedbackQuery = query(
    collection(db, "feedbacks"),
    where("draftId", "==", draftId),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(feedbackQuery);

  return snapshot.docs.map((feedbackDocument) => {
    const data = feedbackDocument.data();

    return {
      id: feedbackDocument.id,
      draftId: data.draftId,
      inviteId: data.inviteId,
      reviewerId: data.reviewerId,
      nickname: data.nickname,
      tags: (data.tags ?? []) as FeedbackTag[],
      comment: data.comment,
      createdAt: assertTimestamp(data.createdAt),
    };
  });
}

export async function updateDraft(
  draftId: string,
  input: { title: string; content: string },
) {
  const trimmedTitle = input.title.trim();
  const trimmedContent = input.content.trim();

  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content are required.");
  }

  await updateDoc(doc(db, "drafts", draftId), {
    title: trimmedTitle,
    content: trimmedContent,
    updatedAt: serverTimestamp(),
  });
}
