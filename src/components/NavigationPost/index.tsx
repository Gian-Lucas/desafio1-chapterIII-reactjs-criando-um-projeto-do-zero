import Link from 'next/link';
import styles from './styles.module.scss';

interface NavigationPostProps {
  nextPost: { title: string; uid: string } | null;
  prevPost: { title: string; uid: string } | null;
}

export default function NavigationPost({
  nextPost,
  prevPost,
}: NavigationPostProps) {
  return (
    <div className={styles.container}>
      {prevPost && (
        <div className={styles.prev}>
          <span>{prevPost.title}</span>
          <Link href={`/post/${prevPost.uid}`}>
            <a>Post anterior</a>
          </Link>
        </div>
      )}

      {nextPost && (
        <div className={styles.next}>
          <span>{nextPost.title}</span>
          <Link href={`/post/${nextPost.uid}`}>
            <a>Próximo post</a>
          </Link>
        </div>
      )}
    </div>
  );
}
