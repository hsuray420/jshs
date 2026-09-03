import { listPendingSchoolReviews } from "../../../../db/school-review-store";
import { requireAdmin } from "../../auth";

export const dynamic = "force-dynamic";

export default async function SchoolReviewsPage() {
  await requireAdmin();
  const reviews = await listPendingSchoolReviews();
  return <><section className="admin-page-heading"><div><p className="admin-eyebrow">Data / Moderation</p><h1>學校分享審核</h1><p className="admin-muted">匿名分享先審核，再公開到學校頁面。</p></div></section><section className="admin-panel"><div className="admin-section-head"><h2>待審核分享</h2><span className="admin-badge warn">{reviews.length} 筆</span></div><div className="admin-deployment-list">{reviews.map((review) => <article className="admin-deployment-item" key={review.id}><div><strong>{review.school_name}</strong><p>{review.content}</p><small>{review.nickname} · {review.district} · {review.created_at}</small></div><div className="admin-actions"><form action="/api/admin/school-reviews" method="post"><input type="hidden" name="id" value={review.id} /><input type="hidden" name="status" value="published" /><button className="admin-button" type="submit">審核公開</button></form><form action="/api/admin/school-reviews" method="post"><input type="hidden" name="id" value={review.id} /><input type="hidden" name="status" value="rejected" /><button className="admin-button admin-button-danger" type="submit">退回</button></form></div></article>)}{!reviews.length ? <p className="admin-muted">目前沒有待審核分享。</p> : null}</div></section></>;
}
