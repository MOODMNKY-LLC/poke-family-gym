
# AI Prompts for Working with Supabase

This document provides prompts and best practices for using Supabase in your projects with AI-powered IDE tools (e.g., GitHub Copilot, Cursor). It includes guidance for:

1. Bootstrapping a Next.js app with Supabase Auth  
2. Creating Row-Level Security (RLS) policies  
3. Writing Supabase-friendly Postgres functions  
4. Generating and naming migration files  
5. Following a standardized Postgres SQL style guide  

---

## 1. Bootstrap Next.js App with Supabase Auth

Create a Next.js app that uses the Next.js App Router with Supabase Auth. Follow Supabase’s guidelines for using the `@supabase/ssr` package with Server-Side Auth.

### Key Requirements

- **Client-Side Client**: A utility function for creating a Supabase client on the client side.  
- **Server-Side Client**: A utility function for creating a Supabase client on the server side. This should use the Next.js `cookies` API, ensuring that `cookies` are awaited and properly handled.  
- **Middleware Session Refresh**: A utility function in middleware to refresh the user session.

### Working with Cookies

Use the latest version of `@supabase/ssr`, where cookie options are handled using `getAll` and `setAll`:

```ts
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  }
);
```

> **Important**: Do not provide any additional cookie options.

### Middleware

Below is an example `updateSession` middleware function, illustrating how to refresh user sessions and optionally redirect unauthenticated users:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid any logic between createServerClient and supabase.auth.getUser().
  // Doing so can cause unpredictable session issues.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in and user tries to access a protected route, redirect to login:
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Always return `supabaseResponse`, preserving the existing cookies.
  return supabaseResponse;
}
```

---

## 2. Database: Create RLS Policies

You are a Supabase Postgres expert writing Row-Level Security (RLS) policies. Generate valid SQL policies (using `CREATE POLICY` or `ALTER POLICY` only) under the constraints below:

1. **Valid SQL**: Must be valid Postgres SQL.  
2. **Policy Types**:  
   - **SELECT**: Always use `USING` but **not** `WITH CHECK`.  
   - **INSERT**: Always use `WITH CHECK` but **not** `USING`.  
   - **UPDATE**: Often needs both `USING` and `WITH CHECK`.  
   - **DELETE**: Always use `USING` but **not** `WITH CHECK`.  
3. **Policy Names**: Use a short descriptive message in double quotes (e.g., `"My descriptive policy."`).  
4. **Roles**: Rely on `to authenticated` or `to anon`.  
5. **Usage of `auth.uid()`**: Always use `auth.uid()` instead of `current_user`.  
6. **Multiple Operations**: Do not combine them (e.g., `for insert, delete`). Split them into separate `CREATE POLICY` statements.  
7. **Output**:  
   - Must be **valid** markdown with a fenced code block (```sql … ```).  
   - Policy name must be enclosed in double quotes.  
   - Provide short, separate explanations outside the SQL code.  
   - Discourage `RESTRICTIVE` and encourage `PERMISSIVE` policies, with an explanation.  

### Authenticated vs. Unauthenticated Roles

In Supabase, requests map to either `anon` (unauthenticated) or `authenticated` (logged-in user). Policies can target these roles individually:

```sql
create policy "Profiles are viewable by everyone"
on profiles
for select
to authenticated, anon
using ( true );
```

### Multiple Operations

PostgreSQL does **not** support specifying multiple operations (`for insert, delete`) in a single policy. Split them:

```sql
-- Incorrect
create policy "Profiles can be created and deleted by any user"
on profiles
for insert, delete
to authenticated
with check ( true )
using ( true );
```

```sql
-- Correct
create policy "Profiles can be created by any user"
on profiles
for insert
to authenticated
with check ( true );

create policy "Profiles can be deleted by any user"
on profiles
for delete
to authenticated
using ( true );
```

### Helper Functions

- **`auth.uid()`**: Returns the ID of the user.  
- **`auth.jwt()`**: Returns the JWT of the user. Data stored in `raw_user_meta_data` can be changed by the user; data in `raw_app_meta_data` cannot.  

### MFA

You can enforce multi-factor authentication by checking `auth.jwt()` for a certain AAL (Authentication Assurance Level):

```sql
create policy "Restrict updates."
on profiles
as restrictive
for update
to authenticated
using (
  (select auth.jwt()->>'aal') = 'aal2'
);
```

> **Note**: We generally discourage `restrictive` policies unless truly necessary.

### RLS Performance Recommendations

1. **Add Indexes**: Index columns used in the policy’s `WHERE` clause.  
2. **Call Functions via `SELECT`**: E.g., `(select auth.uid()) = user_id` so PostgreSQL can cache the result per statement.  
3. **Minimize Joins**: Avoid joins in the policy. Use `IN` or `ANY` subqueries instead.  
4. **Specify Roles**: Always use `TO authenticated` or `TO anon` explicitly.

---

## 3. Database: Create Functions

Generate high-quality PostgreSQL functions under these best practices:

1. **Default to `SECURITY INVOKER`**  
2. **Set `search_path` to an empty string** and use fully qualified references.  
3. **Adhere to SQL Standards** and use valid Postgres syntax.  
4. **Minimize Side Effects**  
5. **Use Explicit Typing**  
6. **Default to `IMMUTABLE` or `STABLE`** whenever possible. Use `VOLATILE` only if necessary.  
7. **Include Trigger Creation** if applicable.

### Examples

**Simple function with `SECURITY INVOKER`:**

```sql
create or replace function my_schema.hello_world()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return 'hello world';
end;
$$;
```

**Function with parameters and fully qualified object names:**

```sql
create or replace function public.calculate_total_price(order_id bigint)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total numeric;
begin
  select sum(price * quantity)
    into total
    from public.order_items
    where order_id = calculate_total_price.order_id;

  return total;
end;
$$;
```

**Function as a trigger:**

```sql
create or replace function my_schema.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger update_updated_at_trigger
before update on my_schema.my_table
for each row
execute function my_schema.update_updated_at();
```

---

## 4. Database: Create Migration

You are a Postgres expert creating secure database schemas using Supabase CLI migrations.

### Creating a Migration File

- Place your migration file in `supabase/migrations/`.  
- Use the naming convention:  
  `YYYYMMDDHHmmss_short_description.sql`  
  with UTC date/time. For example:  
  `20240906123045_create_profiles.sql`  

### SQL Guidelines

1. **Header Comment**: Include metadata about the migration’s purpose, affected tables/columns, and any special considerations.  
2. **Thorough Comments**: Explain each step, especially destructive commands (truncate, drop, alter).  
3. **Lowercase SQL**: Keep all SQL keywords in lowercase.  
4. **Enable RLS**: Whenever you create a table, enable Row-Level Security.  
5. **RLS Policies**:  
   - Include a separate policy for `select`, `insert`, `update`, `delete`, each with explicit `TO anon` or `TO authenticated`.  
   - Use `true` if the table is intended for public access.  
6. **Production-Ready**: The SQL code should be well-documented and compatible with Supabase best practices.

---

## 5. Postgres SQL Style Guide

### General

- Use **lowercase** for SQL keywords (e.g., `select`, `from`, `where`).
- Write descriptive, consistent identifiers for tables, columns, and other objects.
- Use whitespace and indentation to improve readability.
- Store dates in ISO 8601 format (`yyyy-mm-ddThh:mm:ss.sssss`).
- Add comments for complex logic using `--` for line comments or `/* ... */` for block comments.

### Naming Conventions

- Avoid SQL reserved words.
- Use **snake_case**.
- Prefer **plural** names for tables and **singular** names for columns.

### Tables

- Avoid prefixes like `tbl_` and ensure table names are not the same as any column names.
- Use an `id` column of type `bigint generated always as identity primary key` unless otherwise specified.
- Always create tables under `public` unless another schema is required.
- Add a comment describing each table:

```sql
create table public.books (
  id bigint generated always as identity primary key,
  title text not null,
  author_id bigint references authors (id)
);

comment on table public.books is 'A list of all the books in the library.';
```

### Columns

- Use **singular** names.
- For foreign keys, append `_id` to reference columns. E.g., `user_id` references `users`.

### Queries

- For short queries, keep them concise:

```sql
select *
from employees
where end_date is null;

update employees
set end_date = '2023-12-31'
where employee_id = 1001;
```

- For larger queries, use newlines and indentation for clarity:

```sql
select
  first_name,
  last_name
from
  employees
where
  start_date between '2021-01-01' and '2021-12-31'
  and status = 'employed';
```

### Joins and Subqueries

```sql
select
  employees.employee_name,
  departments.department_name
from
  employees
join
  departments on employees.department_id = departments.department_id
where
  employees.start_date > '2022-01-01';
```

### Aliases

- Use meaningful aliases with the `as` keyword:

```sql
select count(*) as total_employees
from employees
where end_date is null;
```

### Complex Queries and CTEs

```sql
with department_employees as (
  -- Get all employees and their departments
  select
    employees.department_id,
    employees.first_name,
    employees.last_name,
    departments.department_name
  from
    employees
  join
    departments on employees.department_id = departments.department_id
),
employee_counts as (
  -- Count how many employees in each department
  select
    department_name,
    count(*) as num_employees
  from
    department_employees
  group by
    department_name
)
select
  department_name,
  num_employees
from
  employee_counts
order by
  department_name;
```

---

> **End of Document**  
> This comprehensive guide should help you bootstrap Next.js with Supabase Auth, create secure RLS policies, generate well-structured Postgres functions and migrations, and maintain a clean, consistent SQL style throughout your application.