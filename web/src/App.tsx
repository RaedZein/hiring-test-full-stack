import React from 'react';
import {Navbar} from "./components/layout/navbar";
import {createBrowserRouter, Outlet, RouterProvider} from "react-router-dom";
import {HomePage} from "./pages/home-page";
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {ErrorBoundary} from "react-error-boundary";
import {Toaster} from "./components/ui/sonner";
import {ErrorFallback} from "./components/layout/error-fallback";
import {queryClient} from "./lib/query-client";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <Navbar />
                <div className={"px-8 pt-4 pb-16"}>
                    <Outlet />
                </div>
            </>
        ),
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
        ]
    }
]);

function App() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools />
                <Toaster position="bottom-right" />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
