import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface HomeProps {
  next_page: string;
  posts: Post[];
}

export default function Home(postsPagination: HomeProps) {
  const { posts: results, next_page } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleLoadMorePosts() {
    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        const newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'PP',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setNextPage(data.next_page);
        setPosts([...posts, ...newPosts]);
      });
  }

  return (
    <>
      <div className={styles.container}>
        {posts.map(post => {
          return (
            <div className={styles.post} key={post.uid}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>

              <div className={styles.info}>
                <div>
                  <FiCalendar />
                  <span>{post.first_publication_date}</span>
                </div>
                <div className={styles.info}>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </div>
          );
        })}

        {nextPage ? (
          <button onClick={handleLoadMorePosts}>Carregar mais posts</button>
        ) : (
          ''
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 1 }
  );

  const { next_page, results } = postsResponse;

  const posts = results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'PP',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      posts,
      next_page,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
